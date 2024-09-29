const express=require("express")
const router=express.Router()
const userController=require("../controllers/user/userController")
const passport = require("passport")
const { isUserBlocked,isAuthenticated,checkProductBlocked,ensureAuthenticated }=require("../middlewares/authMiddleware")
const profileController=require("../controllers/user/profileController")
const cartController=require('../controllers/user/cartController')
const checkoutController=require('../controllers/user/checkoutController')
const ordersController=require('../controllers/user/ordersController')
const forgotPasswordController = require('../controllers/user/forgotPasswordController')
const wishController=require('../controllers/user/wishController')

// router.use(isUserBlocked)
router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.post("/verify-otp",userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)
router.get('/shop',checkProductBlocked,isUserBlocked, userController.loadShop)
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
  router.get("/profile",isUserBlocked, isAuthenticated, profileController.loadProfile)
  router.get("/edit-profile",isUserBlocked, isAuthenticated, profileController.loadEditProfile)
  router.post("/update-profile",isUserBlocked, isAuthenticated, profileController.updateProfile)
  router.post("/profile/verify-password",isUserBlocked, isAuthenticated, profileController.verifyPassword);
router.post("/profile/reset-password",isUserBlocked, isAuthenticated, profileController.resetPassword);
router.post('/add-address',isUserBlocked, isAuthenticated,profileController.addAddress)
router.get('/edit-address/:id',isUserBlocked, isAuthenticated, profileController.loadEditAddress);
router.post('/edit-address/:id', isUserBlocked, isAuthenticated,profileController.editAddress);
router.delete('/delete-address/:id',isUserBlocked, isAuthenticated, profileController.removeAddress);
router.get('/orders',isUserBlocked, isAuthenticated, ordersController.getOrderHistory);
router.get('/orders/view/:orderId',isUserBlocked, isAuthenticated, ordersController.viewOrder)
router.post('/orders/cancel/product/:orderId/:productId',isUserBlocked, isAuthenticated, ordersController.cancelProduct);
router.post('/orders/return/product/:orderId/:productId',isUserBlocked, isAuthenticated, ordersController.returnProduct);
router.get('/orders/invoice/:orderId',isUserBlocked, isAuthenticated, ordersController.downloadInvoice);
router.post('/retry-payment/:orderId',isUserBlocked, isAuthenticated,checkoutController.retryPayment)


router.get('/cart', isUserBlocked, isAuthenticated, cartController.viewCart);
router.get('/add-to-cart/:productId',isUserBlocked, isAuthenticated, cartController.addToCart);
router.post('/update-cart/:productId', isUserBlocked, isAuthenticated, cartController.updateCartQuantity);
router.post('/remove-from-cart/:productId', isUserBlocked, isAuthenticated, cartController.removeFromCart);

router.get('/checkout', isUserBlocked, isAuthenticated, checkoutController.loadCheckout);
router.post('/place-order', isUserBlocked, isAuthenticated, checkoutController.placeOrder)
router.get('/thankyou', isUserBlocked, isAuthenticated, checkoutController.loadThankyou);
router.post('/create-razorpay-order',isUserBlocked, isAuthenticated, checkoutController.createRazorpayOrder);
router.post('/place-order-again', isUserBlocked, isAuthenticated,checkoutController. processOrder)
router.post('/validate-cart-stock',isUserBlocked, isAuthenticated,checkoutController. validateCartStock);

router.get('/edit-address1/:id',isUserBlocked, isAuthenticated, profileController.loadEditAddress1);
router.post('/edit-address1/:id',isUserBlocked, isAuthenticated, profileController.editAddress1);

router.get('/forgot-password',isUserBlocked, isAuthenticated, forgotPasswordController.loadForgotPasswordPage);
router.post('/send-otp',isUserBlocked, isAuthenticated, forgotPasswordController.sendResetOtp)
router.post('/verify-otp1',isUserBlocked, isAuthenticated, forgotPasswordController.verifyResetOtp)
router.get('/reset-password',isUserBlocked, isAuthenticated, forgotPasswordController.loadResetPassword)
router.post('/reset-password',isUserBlocked, isAuthenticated, forgotPasswordController.resetPassword);

router.post('/cart/apply-coupon',isUserBlocked, isAuthenticated, cartController.applyCoupon)
router.post('/cart/remove-coupon',isUserBlocked, isAuthenticated, cartController.removeCoupon)

router.post('/wishlist/add/:productId',isUserBlocked, isAuthenticated, wishController.addToWishlist);
router.get('/wishlist', isUserBlocked, isAuthenticated, wishController.viewWishlist);
router.post('/wishlist/remove/:productId',isUserBlocked, isAuthenticated,wishController.removeProduct)
router.post('/cart/add/:productId',isUserBlocked, isAuthenticated,wishController.addCart)
module.exports=router
