const express=require("express")
const router=express.Router()
const userController=require("../controllers/user/userController")

router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.post("/verify-otp",userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)
router.get('/shop',userController.loadShop)

module.exports=router
