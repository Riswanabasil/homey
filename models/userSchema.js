const mongoose=require("mongoose")
const {Schema}=mongoose

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
    type:String,
    required:true,
    unique:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    // cart:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Cart"
    // }],
    // wallet:{
    //     type:Schema.Types.ObjectId,
    //     ref:"Wallet",
    //     default:0
    // },
    // whishlist:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Whishlist"
    // }],
    // orderHistory:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Order"
    // }],
    // createdOn:{
    //     type:Date,
    //     default:Date.now
    // },
    // searchHistory:[{
    //     category:{
    //         type:Schema.Types.ObjectId,
    //         ref:"Category"
    //     },
    //     searchedOn:{
    //         type:Date,
    //         default:Date.now
    //     }
    // }]
})

const User=mongoose.model("User",userSchema)

module.exports=User