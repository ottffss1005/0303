const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
    photoId: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // type: String,
        // required: true,
        // maxlength: 50
    },
    snsApi:{
        type:Boolean,
        default: false,
    },
    uploadTime:{
        type: Date,
        default: Date.now,
    },
    photoUrl:{
        type:String,
    }
});

module.exports = mongoose.model('Photo', photoSchema);