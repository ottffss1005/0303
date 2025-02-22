const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    answerId: {
        type: String,
        required: true,
        unique: true,
    },
    questionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    },
    answerText:{
        type:String,
    },
});

module.exports=mongoose.model('Answer',answerSchema);