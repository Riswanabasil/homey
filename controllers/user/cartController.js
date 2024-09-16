const User=require('../../models/userSchema')
const Product=require('../../models/productSchema');
const Coupon=require('../../models/couponSchema')
const { model } = require('mongoose');

const viewCart = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId).populate('cart.productId');

      user.cart=user.cart.filter(item=>{
        if(item.productId.isBlocked||item.productId.quantity===0){
            return false
        }
        return true
      })
  user.save()
      let subtotal = 0;
      user.cart.forEach(item => {
        subtotal += item.productId.salePrice * item.quantity;
      });
  
      let total = subtotal;
      
      res.render('cart', { cart: user.cart, subtotal, total });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };


const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        if (product.isBlocked) {
            return res.json({ success: false, message: 'Product is blocked and cannot be added to the cart' });
        }
        if (product.quantity <= 0) {
            return res.json({ success: false, message: 'Product is out of stock' });
        }
        const user = await User.findById(userId);
        const productInCart = user.cart.find(item => item.productId.toString() === productId);
        if (productInCart) {
            if (productInCart.quantity >= 5) {
                return res.json({ success: false, message: 'You cannot add more than 5 units of this product to your cart' });
            }
            // if (productInCart.quantity + 1 > product.quantity) {
            //     return res.json({ success: false, message: 'Not enough stock available' });
            // }
            productInCart.quantity += 1;
           
        } else {
            // if (product.quantity < 1) {
            //     return res.json({ success: false, message: 'Not enough stock available' });
            // }
            user.cart.push({ productId, quantity: 1 });
        }

       

        await user.save();
        await product.save();

        return res.json({ success: true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: 'Server error' });
    }
};
const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;
        const { quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        if (product.isBlocked) {
            return res.json({ success: false, message: 'Product is blocked and cannot be added to the cart' });
        }
        if (product.quantity < 1) {
            return res.json({ success: false, message: 'Not enough stock available' });
        }
        const user = await User.findById(userId);
        const productInCart = user.cart.find(item => item.productId.toString() === productId);

        if (productInCart) {
            if (quantity > 5) {
                return res.json({ success: false, message: 'You cannot add more than 5 units of this product to your cart' });
            }
            if(quantity>product.quantity){
                return res.json({success:false, message:`Only ${product.quantity} products left` })
            }
            productInCart.quantity = quantity;
        } else {
            user.cart.push({ productId, quantity });
        }
        

        await user.save();

       
        

        return res.json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: 'Server error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;

        await User.findByIdAndUpdate(userId, { $pull: { cart: { productId } } });
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const applyCoupon=async(req,res)=>{
    try {
        const {couponCode}=req.body
        const userId=req.session.user
        const coupon= await Coupon.findOne({name:couponCode,expiry:{$gte:new Date()}})

        if (!coupon){
            return res.status(400).json({success:false, message:'Invalid or Expired coupon'})
        }

        const user= await User.findById(userId).populate('cart.productId')
        const subtotal=user.cart.reduce((sum,item)=>sum+item.quantity*item.productId.salePrice,0)

        if (subtotal < coupon.minimumPurchase) {
            return res.status(400).json({ 
                success: false, 
                message: `Subtotal must be at least ${coupon.minimumPurchase} to use this coupon.` 
            });
        } 
        
        const discount=coupon.value
        const total=subtotal-discount

        req.session.coupon = {
            code: coupon.name,
            discount,
            total,
        };

        return res.status(200).json({success:true, discount,total})
    } catch (error) {
        console.error('Error applying coupon',error)
        return res.status(500).json({success:false, message:'Server error'})
    }
}
const removeCoupon=async (req, res) => {
    try {
        // Remove the coupon from the session or database
        delete req.session.coupon;

        // Recalculate the cart total without the coupon
        const userId = req.session.user;
        const user = await User.findById(userId).populate('cart.productId');
        const subtotal = user.cart.reduce((sum, item) => sum + item.quantity * item.productId.salePrice, 0);
        const total = subtotal;

        return res.status(200).json({ success: true, total });
    } catch (error) {
        console.error('Error removing coupon:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
module.exports={viewCart,addToCart,updateCartQuantity,removeFromCart,applyCoupon, removeCoupon}