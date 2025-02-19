const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");

const router = express.Router();

// 로그인 엔드포인트
router.post("/login", async (req, res) => {
    const { id, password } = req.body;

    try {
        // 1. DB에서 유저 검색색
        const user = await User.findOne({ userId: id });
        if (!user) {
            return res.status(400).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
        }

        // 2. 비밀번호 비교
        const isMatch = await bcrypt.compare(password, user.userPw);
        if (!isMatch) {
            return res.status(400).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
        }

        // 3. JWT 토큰 생성
        const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ token, message: "로그인 되었습니다." });

    } catch (error) {
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

module.exports = router;