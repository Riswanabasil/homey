const express=require("express")
const router=express.Router()
const userController=require("../controllers/user/userController")
const passport = require("passport")
const { isUserBlocked,isAuthenticated }=require("../middlewares/authMiddleware")

router.use(isUserBlocked)
router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.post("/verify-otp",userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)
router.get('/shop',userController.loadShop)
router.get("/product/:id", userController.getProductDetails)
router.get("/logout",userController.logout)

router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
  router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
      res.redirect('/shop');
    }
  );
module.exports=router
