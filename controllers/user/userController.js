const User=require("../../models/userSchema")
const env=require("dotenv").config()
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")
//load home page
const loadHomepage=async(req,res)=>{
    try {
        return res.render("home")
    } catch (error) {
        console.log("home page is not loading",error);
        res.status(500).send("server error")
    }
}
// load signup
const loadSignup= async(req,res)=>{
    try {
        return res.render("signup")
    } catch (error) {
        console.log("signup page is not loading",error);
        res.status(500).send("server error")
    }
}
// OTP verification
function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp){
try {
    const transporter=nodemailer.createTransport({
        service:"gmail",
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
        }
    })
    const info= await transporter.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:"Verify your account",
        text:`Your otp is ${otp}`,
        html:`<b> Your OTP:${otp}</b>`
    })
    return info.accepted.length>0
} catch (error) {
    console.error("Error sending email",error)
    return false
}
}
const signup= async(req,res)=>{
   try {
    const {name,email,phone, password, cPassword}=req.body
    if(password!==cPassword){
        return res.render("signup",{message:"Password do not match"})
    }

    const findUser= await User.findOne({email})
    if(findUser){
        return res.render("signup",{message:"User with this email already exists"})
    }

    const otp=generateOtp()


    const emailSend= await sendVerificationEmail(email,otp)
    if(!emailSend){
        return res.json("email-error")
    }

    req.session.userOtp=otp
    req.session.userData={name,email,phone,password}

    res.render("verify-otp")
    console.log("OTP sent",otp)
   } catch (error) {
    console.error("signup error",error)
    res.render("/pageNotFound")
   }
}

const securePassword=async (password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}

const verifyotp=async(req,res)=>{
    try {
        const {otp}=req.body
        console.log(otp)
        if(otp===req.session.userOtp){
            const user=req.session.userData
            const passwordHash=await securePassword(user.password)
            const saveUserData=new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })

            await saveUserData.save()
            req.session.user=saveUserData._id
            res.json({success:true, redirectUrl:"/shop"})
        } else {
            res.status(400).json({success:false,message:"Invalid OTP, please try again"})
        }
    } catch (error) {
        console.error("Error verifying OTP",error)
        res.status(500).json({success:false,message:"An error occured"})
    }
}

const resendOtp=async(req,res)=>{
    try {
        const {email}=req.session.userData
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in the session"})
        }
        const otp=generateOtp()
        req.session.userOtp=otp
        const emailSend=await sendVerificationEmail(email,otp)
        if(emailSend){
            console.log("Resend otp:",otp)
            res.status(200).json({success:true,message:"OTP send Successfully"})
        } else{
            res.status(500).json({success:false,message:"Failed to resend otp, please try again"})
        }
    } catch (error) {
        console.error("Error resending otp",otp)
        res.status(500).json({success:false,message:"Internal server error"})
    }
}

// shop page loading

const loadShop=async(req,res)=>{
    try {
        return res.render("shop")
    } catch (error) {
        console.log("shop page is not loading",error);
        res.status(500).send("server error")
    }
}
module.exports={loadHomepage, loadSignup, signup,verifyotp,resendOtp,loadShop}
