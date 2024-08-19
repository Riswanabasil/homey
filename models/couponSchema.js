const mongoose=require('mongoose')
const {Schema}= mongoose

const couponSchema= new Schema ({
    name:{
        type:String,
        required:true,
        unique:true
    },
    expiry:{
        type:Date,
        required:true
    },
    value:{
        type:Number,
        required:true
    },
    minimumPurchase:{
        type:Number,
        required:true
    },
})

const Coupon= mongoose.model('Coupon',couponSchema)

module.exports=Coupon