const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Address=require('../../models/addressSchema')
const Order=require('../../models/orderSchema')
const Razorpay = require('razorpay');
const crypto = require('crypto');

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId).populate('addresses');
        const cart = user.cart.map(async (item) => {
            const product = await Product.findById(item.productId);
            return {
                productId: product._id,
                productName: product.productName,
                quantity: item.quantity,
                salePrice: product.salePrice,
                total: item.quantity * product.salePrice,
            };
        });

        const cartItems = await Promise.all(cart);
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const deliveryFee = 70;

        let discount = 0;
        if (req.session.coupon) {
            discount = req.session.coupon.discount || 0;
        }

        const total = subtotal + deliveryFee - discount;
        
        console.log(req.session.coupon)
        res.render('checkout', { user, cart: cartItems, subtotal, deliveryFee, total,discount });
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Server error');
    }
};

const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        // Initialize Razorpay instance with your API key and secret
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_ID_KEY,
            key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        // Create an order in Razorpay
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
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
        const { addressId, paymentMethod, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const user = await User.findById(userId).populate('cart.productId');
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(400).json({ error: 'Address and payment method are required.' });
        }

        const products = user.cart.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.salePrice
        }));

        const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = 70;
        const discount = req.session.coupon ? req.session.coupon.discount : 0;
        const total = subtotal + deliveryFee - discount;

        const newOrder = new Order({
            user: userId,
            products,
            address: addressId,
            subtotal,
            deliveryFee,
            discount,
            total,
            paymentMethod
        });

        if (paymentMethod === 'Razorpay') {
            // Save Razorpay payment details if the payment method is Razorpay
            newOrder.razorpay = {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature
            };
        }

        await newOrder.save();

        // Decrement the product quantity in the inventory
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();
            }
        }

        // Clear the user's cart
        user.cart = [];
        await user.save();

        delete req.session.coupon
        
        if (paymentMethod === 'Razorpay') {
            return res.json({ success: true });
        }

        res.redirect('/thankyou');
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
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
module.exports={loadCheckout,placeOrder,loadThankyou,createRazorpayOrder}