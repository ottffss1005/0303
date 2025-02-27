const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    userPw:{
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    userEmail:{
        type:String,
    //    required: true
    },
    snsApi:{
        type:Boolean,
        required: true
    }
});

// 사용자 비밀번호 암호화 (pre-save hook)
userSchema.pre("save", async function (next) {
    if (!this.isModified("userPw")) return next(); // 비밀번호가 변경되지 않았다면 넘어감
    try {
        const salt = await bcrypt.genSalt(10);
        this.userPw = await bcrypt.hash(this.userPw, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;