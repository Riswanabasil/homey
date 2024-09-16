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
        required:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    cart: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true, default: 1 }
        }
    ],
    wishlist: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product' }
        }
    ],  
    wallet: {
        type: Number,
        default: 0,
    },
    walletTransactions: [{
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['credit', 'debit'] },
        amount: { type: Number },
        description: { type: String }
    }],
    referralCode:{
        type:String,
        unique:true,
        index:true
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    
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