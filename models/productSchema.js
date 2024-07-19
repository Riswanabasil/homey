const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        default: 0
    },
    productOffer: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true
    },
    quantityOrdered: {
        type: Number,
        default: 0
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
