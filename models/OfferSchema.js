const mongoose=require('mongoose')

const Schema=mongoose.Schema

const offerSchema= new Schema({
    isActive:{
        type:Boolean,
        default:true
    },
    creditAmount:{
        type:Number,
        required:true
    },
    description:String,
    startDate:Date,
    endDate:Date
})

const Offer=mongoose.model('Offer',offerSchema)

module.exports=Offer