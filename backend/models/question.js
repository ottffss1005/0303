const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionId: {
        type: String,
        //unique: true,
    },
    questionText: {
        type: String,
    },
    userId: {
        type:String,
        ref: 'User',
    },
});

module.exports = mongoose.model('Question',questionSchema);