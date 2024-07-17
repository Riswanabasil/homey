const { log } = require("console")
const mongoose=require("mongoose")
const dotenv=require("dotenv").config()

const db=mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("mongodb connected")
}).catch((err)=>{
    console.log("Error in connecting mongodb")
})

module.exports=db