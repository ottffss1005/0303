const mongoose = require("mongoose");

const snsSchema = new mongoose.Schema({

    sns: {
        type: String,
        required: true,
    },
    sns_url:{
        type:String,
    },
    //user_id:{ type: mongoose.Schema.Types.ObjectId, ref:'User'}
});

module.exports = mongoose.model('Sns', snsSchema);