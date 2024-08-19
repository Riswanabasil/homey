const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;

        const user = await User.findById(userId);

        // Check if the product is already in the wishlist
        // const alreadyInWishlist = user.wishlist.some(item => item.toString() === productId);

        // if (alreadyInWishlist) {
        //     return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        // }
        user.wishlist.push({productId});
        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const viewWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.session.user).populate('wishlist.productId');

        res.render('wishlist', { wishlist: user.wishlist });
    } catch (error) {
        console.error('Error loading wishlist:', error);
        res.status(500).send('Server error');
    }
};
const removeProduct=async(req,res)=>{
    try {
        const userId=req.session.user
        const productId=req.params.productId
        const user=await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: { productId } } },
            { new: true }
        );

       
        if (user) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const addCart=async(req,res)=>{
    try {
        const userId = req.session.user;
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        if (product.quantity <= 0) {
            return res.status(400).json({ success: false, message: 'This product is out of stock' });
        }

        const user = await User.findById(userId);

        const productInCart = user.cart.find(item => item.productId.equals(productId));
        if (productInCart) {
            // Increase quantity if already in cart
            productInCart.quantity += 1;
        } else {
            // Add new product to cart
            user.cart.push({ productId, quantity: 1 });
        }
        await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: { productId } } },
            { new: true }
        );
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
module.exports={addToWishlist,viewWishlist,removeProduct,addCart}