const express=require("express")
const router=express.Router()
const userController=require("../controllers/user/userController")
const passport = require("passport")
const { isUserBlocked,isAuthenticated,checkProductBlocked,ensureAuthenticated }=require("../middlewares/authMiddleware")
const profileController=require("../controllers/user/profileController")
const cartController=require('../controllers/user/cartController')
const checkoutController=require('../controllers/user/checkoutController')

router.use(isUserBlocked)
router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.post("/verify-otp",userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)
router.get('/shop',checkProductBlocked,userController.loadShop)
router.get("/product/:id", userController.getProductDetails)
router.get("/logout",userController.logout)

router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
  router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
      req.session.user = req.user._id;
      res.redirect('/shop');
    }
  );
  router.get("/profile", isAuthenticated, profileController.loadProfile)
  router.get("/edit-profile", profileController.loadEditProfile)
  router.post("/update-profile", profileController.updateProfile)
  router.post("/profile/verify-password", profileController.verifyPassword);
router.post("/profile/reset-password", profileController.resetPassword);
router.post('/add-address',profileController.addAddress)
router.get('/edit-address/:id', profileController.loadEditAddress);
router.post('/edit-address/:id', profileController.editAddress);
router.delete('/delete-address/:id', profileController.removeAddress);

router.get('/cart', isAuthenticated, cartController.viewCart);
router.get('/add-to-cart/:productId', isAuthenticated, cartController.addToCart);
router.post('/update-cart/:productId', isAuthenticated, cartController.updateCartQuantity);
router.post('/remove-from-cart/:productId', isAuthenticated, cartController.removeFromCart);

router.get('/checkout', isAuthenticated, checkoutController.loadCheckout);
router.post('/place-order', isAuthenticated, checkoutController.placeOrder)
router.get('/thankyou', isAuthenticated, checkoutController.loadThankyou);


module.exports=router
