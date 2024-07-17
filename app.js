const express=require ("express")
const path=require("path")
const dotenv=require("dotenv").config()
const session=require("express-session")
const db=require("./config/db")
const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")

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
app.use((req,res,next)=>{
    res.set("cache-control","no-store")
    next()
})

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, 'public')))

app.use("/",userRouter)
app.use("/admin",adminRouter)

app.listen(process.env.PORT,()=>{
    console.log("server is running");
})