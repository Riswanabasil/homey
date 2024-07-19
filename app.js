const dotenv=require("dotenv").config()
const express=require ("express")
const path=require("path")
const session=require("express-session")
const db=require("./config/db")
const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")
const passport=require("./config/passport")
const multer=require("multer")

const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use((req,res,next)=>{
    res.set("cache-control","no-store")
    next()
})

// Set up storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // limit file size to 1MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('productImage', 3); // Allow up to 3 images

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, 'public')))


app.use("/",userRouter)
app.use("/admin",adminRouter)

app.listen(process.env.PORT,()=>{
    console.log("server is running");
})