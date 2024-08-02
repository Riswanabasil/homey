const User=require('../../models/userSchema')
const Product=require('../../models/productSchema');
const { model } = require('mongoose');

const viewCart = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId).populate('cart.productId');
  
      let subtotal = 0;
      user.cart.forEach(item => {
        subtotal += item.productId.salePrice * item.quantity;
      });
  
      const total = subtotal;
  
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
        debugger;
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
        if (product.quantity < quantity) {
            return res.json({ success: false, message: 'Not enough stock available' });
        }
        const user = await User.findById(userId);
        const productInCart = user.cart.find(item => item.productId.toString() === productId);

        if (productInCart) {
            if (quantity > 5) {
                return res.json({ success: false, message: 'You cannot add more than 5 units of this product to your cart' });
            }
            productInCart.quantity = quantity;
        } else {
            // if (quantity < 1) {
            //     return res.json({ success: false, message: 'Not enough stock available' });
            // }
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

module.exports={viewCart,addToCart,updateCartQuantity,removeFromCart}