const User=require("../models/userSchema")
const Product=require("../models/productSchema")
const isAdmin=(req,res,next)=>{
    if(req.session.isAdmin){
        return next()
    }
    return res.redirect('/admin')
}

const isUserBlocked = async (req, res, next) => {
    if (req.session && req.session.user) {
       try {
        const user = await User.findById(req.session.user);
        if (user && user.isBlocked) {
          req.session.destroy((err) => {
            if (err) {
              return next(err);
            }
            return res.render('login', { message: 'User is blocked by admin' });
          });
        } else {
          return next();
        }
      } catch (error) {
        return next(error);
      }
    } else {
      return next();
    }
  };
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login')
  //   return res.send(`
  //     <script>
  //         alert("Please log in to your account.");
  //         window.location.href = "/login";
  //     </script>
  // `);
};

const checkProductBlocked = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.isBlocked) {
      return res.redirect('/shop'); 
    }
   next()
  } catch (error) {
    console.error('Error checking if product is blocked:', error);
    res.redirect('/shop');
  }
}

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};
module.exports={isAdmin, isUserBlocked,isAuthenticated,checkProductBlocked,ensureAuthenticated}