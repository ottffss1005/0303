const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// 로그인 엔드포인트
router.post("/login", async (req, res) => {
    const { userId, userPw } = req.body;

    try {
        // 1. DB에서 유저 검색
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(400).json({ message: "아이디 또는 비밀번호가 틀렸습니다.1" });
        }

        console.log("입력한 비밀번호:", userPw);          // 🔍 입력한 비밀번호 확인
        console.log("DB 저장 비밀번호:", user.userPw);     // 🔍 DB에 저장된 해시 비밀번호 확인
        
        // 2. 비밀번호 비교
        const isMatch = await bcrypt.compare(userPw, user.userPw);

        console.log("비밀번호 일치 여부:", isMatch); 

        if (!isMatch) {
            return res.status(400).json({ message: "아이디 또는 비밀번호가 틀렸습니다.2" });
        }

        // 3. JWT 토큰 생성
        const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ token, message: "로그인 되었습니다." });

    } catch (error) {
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 회원가입 엔드포인트
router.post("/register", async (req, res) => {
    const { userId, userPw, userEmail } = req.body;

    try {
        // 1. 필수 필드 확인
        if (!userId || !userPw) {
            return res.status(400).json({ message: "userId와 userPw는 필수입니다." });
        }

        // 2. userId 중복 확인
        const existingUser = await User.findOne({ userId: userId });
        if (existingUser) {
            return res.status(409).json({ message: "이미 존재하는 userId입니다." });
        }

        // // 3. 비밀번호 해시화
        // const salt = await bcrypt.genSalt(10);
        // const hashedPw = await bcrypt.hash(userPw, salt);

        // 4. 사용자 생성
        const newUser = new User({
            userId: userId,
            // userPw: hashedPw,  // 해시된 비밀번호 저장
            userPw: userPw,
            userEmail: userEmail || "",  // 이메일은 선택사항
            snsApi: false
        });

        await newUser.save();

        // 5. 성공 응답
        res.status(201).json({ message: "회원가입이 완료되었습니다.", userId: userId });

    } catch (error) {
        console.error("회원가입 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 마이페이지용 사용자 정보 조회 엔드포인트
router.get("/profile", authenticateToken, async (req, res) => {
    try {
      // req.user는 jwt.verify에서 설정한 { userId: ... } 객체라고 가정
      const user = await User.findOne({ userId: req.user.userId }).select("-userPw"); // 비밀번호 필드는 제외
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "서버 오류 발생" });
    }
  });

// 마이페이지 사용자 정보 수정 엔드포인트
router.put("/profile", authenticateToken, async (req, res) => {
    try {
      // JWT를 통한 userId는 req.user에 저장
      // (예: { userId: '사용자아이디' })
      const currentUserId = req.user.userId;
  
      // 프런트엔드에서 수정할 데이터 받아오기
      const { userEmail, snsApi, userPw } = req.body;
      // 업데이트할 데이터 객체 생성
      const updateData = { userEmail, snsApi };
  
      // 비밀번호를 수정하는 경우 해싱한 뒤뒤 updateData에 추가
      if (userPw) {
        const salt = await bcrypt.genSalt(10);
        updateData.userPw = await bcrypt.hash(userPw, salt);
      }
  
      // DB에서 해당 사용자를 찾아 업데이트 (new: true 옵션으로 업데이트 후 문서를 반환)
      const updatedUser = await User.findOneAndUpdate(
        { userId: currentUserId },
        updateData,
        { new: true }
      ).select("-userPw"); // 응답에 비밀번호는 포함하지 않음
  
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
  
      res.status(200).json({
        message: "회원 정보가 수정되었습니다.",
        user: updatedUser
      });
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      res.status(500).json({ message: "서버 오류 발생" });
    }
  });


module.exports = router;