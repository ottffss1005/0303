
const express = require("express");
const router = express.Router();
const Photo = require("../models/photo");
const authenticateToken = require("../middleware/authenticateToken");
const upload = require("../config/multer"); //multer


//사진 업로드
router.post("/photos", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ message: "파일 업로드 실패."});
    }
    //파일 업로드 정보

    const photoId = `photo_${Date.now()}`;

    //DB 문서 생성
    const newPhoto = new Photo({
      photoId: photoId,
      userId: req.user.userId,    //JWT에서 추출한 사용자 ID
      snsApi: false,            
      uploadTime: new Date(),
      photoUrl: `/uploads/${req.file.filename}`, //실제 파일 경로
    });

    //저장
    await newPhoto.save();

    //응답
    res.status(201).json({
      message: "사진이 성공적으로 업로드되었습니다.",
      photo: newPhoto,
    });
  } catch (error) {
    console.error("사진 업로드 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

//사용자가 업로드한 사진 리스트 GET
router.get("/photos", authenticateToken, async (req, res) => {
  try {
    //JWT 토큰 사용자 받아옴옴
    const userId = req.user.userId; 

    //DB에서 해당 사용자가 업로드한 사진 모두 조회
    // 정렬 방식 바꿀 수 있음음
    const photos = await Photo.find({ userId: userId }).sort({ uploadTime: -1 });

    res.status(200).json({
      message: "사진 리스트를 불러옵니다.",
      photos: photos
    });
  } catch (error) {
    console.error("사진 리스트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;