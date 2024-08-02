const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Address=require('../../models/addressSchema')
const Order=require('../../models/orderSchema')

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
        const total = subtotal + deliveryFee;

        res.render('checkout', { user, cart: cartItems, subtotal, deliveryFee, total });
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Server error');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod } = req.body;

        const user = await User.findById(userId).populate('cart.productId');
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(400).send('Invalid address selected');
        }

        const products = user.cart.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.salePrice
        }));

        const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = 70;
        const total = subtotal + deliveryFee;

        const newOrder = new Order({
            user: userId,
            products,
            address: addressId,
            subtotal,
            deliveryFee,
            total,
            paymentMethod
        });

        await newOrder.save();

        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();
            }
        }
        
        user.cart = [];
        await user.save();

        res.redirect('/thankyou');
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
};

const loadThankyou=async(req,res)=>{
    try {
        return res.render("thankyou")
    } catch (error) {
        console.log("thankyou page is not loading",error);
        res.status(500).send("server error")
    }
}
module.exports={loadCheckout,placeOrder,loadThankyou}