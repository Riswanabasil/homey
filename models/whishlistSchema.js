const mongoose=require("mongoose")
const {Schema}=mongoose
const whishlistSchema= new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    products:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        addedOn:{
            type:Date,
            defau:Date.now
        }
    }]

})

const Whishlist=mongoose.model("Wishlist", whishlistSchema)

module.exports=Whishlist