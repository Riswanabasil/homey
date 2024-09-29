const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Address=require('../../models/addressSchema')
const Order=require('../../models/orderSchema')
const Razorpay = require('razorpay');
const Coupon=require('../../models/couponSchema')

const loadCheckout = async (req, res) => {
    try {
        let cartCount = null;
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            cartCount = user.cart.reduce((acc, item) => acc + item.quantity, null);
        }
        const userId = req.session.user;
        const user = await User.findById(userId).populate('addresses');
        if (user.cart.length === 0) {
           return res.redirect ("/cart")
        }

        const cart = user.cart.map(async (item) => {
            const product = await Product.findById(item.productId);
            return {
                productId: product._id,
                productName: product.productName,
                quantity: item.quantity,
                salePrice: product.salePrice,
                total: item.quantity * (product.salePrice - (product.salePrice * product.productOffer / 100)),
                offer:product.productOffer
            };
        });

        const cartItems = await Promise.all(cart);
        const cartTotal= cartItems.reduce((sum, item) => sum + item.salePrice, 0);
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const deliveryFee = 70;

        let discount = 0;
        if (req.session.coupon) {
            discount = req.session.coupon.discount || 0;
        }

        const total = subtotal + deliveryFee - discount;

        const coupons = await Coupon.find({ expiry: { $gte: new Date() } });

        res.render('checkout', { user, cart: cartItems, cartTotal, deliveryFee, total,discount,cartCount,session: req.session,coupons });
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Server error');
    }
};

const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_ID_KEY,
            key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        const options = {
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send('Some error occurred');

        res.status(200).json({ success: true, id: order.id, amount: order.amount });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { useWallet, addressId, paymentMethod, razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentStatus } = req.body;

        const user = await User.findById(userId).populate({
            path: 'cart.productId',
            populate: { path: 'category' } 
        });

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ error: 'Address and payment method are required.' });
        }

        let subtotal = 0;
        const products = user.cart.map(item => {
            const product = item.productId;
            const categoryOffer = product.category ? product.category.offer : 0;
            const productOffer = product.productOffer;
            const bestOffer = Math.max(categoryOffer, productOffer);

            const discountedPrice = product.salePrice - (product.salePrice * bestOffer / 100);
            const totalPriceForProduct = discountedPrice * item.quantity;

            subtotal += totalPriceForProduct;

            return {
                productId: product._id,
                quantity: item.quantity,
                price: discountedPrice,
                appliedOffer: bestOffer
            };
        });


        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (product && product.quantity < item.quantity) {
                return res.status(400).json({ 
                    
                    error: `The product "${product.productName}" has only ${product.quantity} in stock, but you requested ${item.quantity}.` 
                });
            }
        }

        const deliveryFee = 70;
        const discount = req.session.coupon ? req.session.coupon.discount : 0;
        let total = subtotal + deliveryFee - discount;

        let walletDeduction = 0;
        if (useWallet === true && user.wallet > 0) {
            walletDeduction = Math.min(user.wallet, total);
            user.wallet -= walletDeduction;
            total -= walletDeduction;
            user.walletTransactions.push({
                date: new Date(), 
                type: 'debit',  
                amount: walletDeduction,  
                description: 'Wallet amount used to purchase'
            });
            await user.save();
        }

        const newOrder = new Order({
            user: userId,
            products,
            address: addressId,
            subtotal,
            deliveryFee,
            discount,
            total,
            paymentMethod,
            paymentStatus: paymentStatus || 'Pending' 
        });

        
        if (paymentMethod === 'Razorpay') {
            if (paymentStatus === 'Completed') {
                newOrder.razorpay = {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    signature: razorpay_signature
                };
                newOrder.paymentStatus = 'Completed';
                newOrder.status = 'Order Placed';
            } else if (paymentStatus === 'Failed') {
                newOrder.paymentStatus = 'Failed'; 
                newOrder.status = 'Payment Failed'; 
                user.cart = [];
            await user.save();
            }
        }

        await newOrder.save();

        
        if (newOrder.paymentStatus === 'Completed') {
            for (const item of products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.quantity -= item.quantity;
                    await product.save();
                }
            }
            user.cart = [];
            await user.save();
            delete req.session.coupon;
        }

        return res.json({ success: true });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
};
const validateCartStock = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId).populate('cart.productId');

        for (const cartItem of user.cart) {
            const product = cartItem.productId;
            if (product.quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `The product "${product.productName}" has only ${product.quantity} in stock, but you requested ${cartItem.quantity}.`
                });
            }
        }
     res.json({ success: true });
    } catch (error) {
        console.error('Error validating cart stock:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadThankyou=async(req,res)=>{
    try {
        debugger;
        return res.render("thankyou")
    } catch (error) {
        debugger;
        console.log("thankyou page is not loading",error);
        res.status(500).send("server error")
    }
}

const retryPayment=async (req, res) => {
    try {
        const orderId = req.params.orderId;

        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({ success: true, order: order });
    } catch (error) {
        console.error('Error retrying payment:', error);
        res.status(500).json({ success: false, message: 'Server error during retry' });
    }
};
const processOrder = async (req, res) => {
    try {
        const { paymentMethod, razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId, paymentStatus } = req.body;

        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentMethod = paymentMethod;
        order.razorpay = {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature
        };
        order.paymentStatus = paymentStatus || 'Pending';
        order.status = paymentStatus === 'Completed' ? 'Order Placed' : 'Payment Failed';

        if (paymentStatus === 'Completed') {
            
            for (const item of order.products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.quantity -= item.quantity;
                    await product.save();
                }
            }

            
            const user = await User.findById(order.user);
            if (user) {
                user.cart = []; 
                await user.save();
            }
            delete req.session.coupon; 
        }

        await order.save();

        return res.json({ success: true });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ success: false, message: 'Server error while processing retry payment' });
    }
};

module.exports={loadCheckout,placeOrder,loadThankyou,createRazorpayOrder,retryPayment,processOrder,validateCartStock }