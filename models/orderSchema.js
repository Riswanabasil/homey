const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid')
const { Schema } = mongoose;

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },appliedOffer: { 
                type: Number,
                default: 0
            },status: {  
                type: String,
                default: 'Order Placed',
                enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
            },
            statusHistory: [  
                {
                    status: { 
                        type: String, 
                        enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] 
                    },
                    timestamp: { type: Date, default: Date.now }
                }
            ]
        }
    ],
    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 70
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'Razorpay','Wallet']
    },
    razorpay: {
        paymentId: {
            type: String,
            required: function() {
                return this.paymentMethod === 'Razorpay' && this.paymentStatus === 'Completed';
            }
        },
        orderId: {
            type: String,
            required: function() {
                return this.paymentMethod === 'Razorpay' && this.paymentStatus === 'Completed';
            }
        },
        signature: {
            type: String,
            required: function() {
                return this.paymentMethod === 'Razorpay' && this.paymentStatus === 'Completed';
            }
        }
    },
    paymentStatus: {  
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Completed', 'Failed']
    },
    status: {
        type: String,
        default: 'Order Placed',
        enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled','Returned','Payment Failed']
    },
    statusHistory: [
        {
            status: { type: String, enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
