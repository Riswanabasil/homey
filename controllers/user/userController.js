const User=require("../../models/userSchema")
const env=require("dotenv").config()
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")
const Product=require("../../models/productSchema")
const Category=require("../../models/categorySchema")
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
        return res.render("signup",{message:""})
    } catch (error) {
        console.log("signup page is not loading",error);
        res.status(500).send("server error")
    }
}
// load login

const loadLogin=async(req,res)=>{
    try {
        return res.render("login",{message:""})
    } catch (error) {
        console.log("signup page is not loading",error);
        res.status(500).send("server error")
    }
}

const login=async (req,res)=>{
    try {
        const {email,password}=req.body
        const findUser=await User.findOne({isAdmin:0,email:email})
        if(!findUser){
            return res.render("login",{message:"user not found"})
        }
        if(findUser.isBlocked){
            return res.render("login",{message:"user is blocked by admin"})
        }
        const passwordMatch=await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
            return res.render("login",{message:"Incorrect username or password"})
        }
        req.session.user = findUser._id.toString();
        
        res.redirect("/shop")
    } catch (error) {
        console.error("login error",error)
        res.render("login",{message:"login failed, try again later"})
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



const loadShop = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        const categoryFilter = req.query.category;
        const sortOption = req.query.sort || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const searchTerm = req.query.search || '';

        let sortCriteria = {};
        let filterCriteria = { isBlocked: false };

        if (categoryFilter) {
            filterCriteria.category = categoryFilter;
        }

        if (searchTerm) {
            filterCriteria.productName = { $regex: searchTerm, $options: 'i' };
        }

        switch (sortOption) {
            case 'popularity':
                sortCriteria = { popularity: -1 };
                break;
            case 'price-asc':
                sortCriteria = { salePrice: 1 };
                break;
            case 'price-desc':
                sortCriteria = { salePrice: -1 };
                break;
            case 'ratings':
                sortCriteria = { averageRating: -1 };
                break;
            case 'featured':
                sortCriteria = { isFeatured: -1 };
                break;
            case 'new-arrivals':
                sortCriteria = { createdOn: -1 };
                break;
            case 'a-z':
                sortCriteria = { productName: 1 };
                break;
            case 'z-a':
                sortCriteria = { productName: -1 };
                break;
        }

        const count = await Product.countDocuments(filterCriteria);
        let products = await Product.find(filterCriteria)
                                    .populate({
                                        path: 'category',
                                        match: { isListed: true }
                                    })
                                    .sort(sortCriteria)
                                    .skip((page - 1) * limit)
                                    .limit(limit)
                                    .exec();

        // Filter out products with unlisted categories
        products = products.filter(product => product.category);

        return res.render('shop', { 
            products, 
            categories, 
            sortOption, 
            currentPage: page, 
            totalPages: Math.ceil(count / limit),
            categoryFilter,
            searchTerm
        });
    } catch (error) {
        console.log('shop page is not loading', error);
        res.status(500).send('server error');
    }
};


  
const getProductDetails=async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product || product.isBlocked) {
            return res.redirect('/shop');
          }
        const relatedProducts = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(5);
        const user= await User.findById(req.session.user).populate('wishlist')
        res.render('detail', { product, relatedProducts,user });
    } catch (error) {
        console.error('Error fetching product detail:', error);
        res.redirect('/');
    }
};

//logout

const logout=(req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/shop');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
}
module.exports={loadHomepage, loadSignup, signup,verifyotp,resendOtp,loadShop,loadLogin,login,getProductDetails,logout,generateOtp, sendVerificationEmail, securePassword}

