const mongoose = require('mongoose');
const { Schema } = mongoose;

const bannerSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    bannerImage: {
        type: String, 
        required: true,
    },
    
});

const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;
