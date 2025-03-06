const multer = require("multer");
const path = require("path");

// 스크 스토리지
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //폴더 지정
    cb(null, "uploads/"); // 서버 루트 기준 "uploads" 폴더
  },
  filename: (req, file, cb) => {
    //파일명: 원본 이름 + 현재 시간+ 확장자
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueName = `${basename}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

//Multer 설정 - 필요 시 파일 크기및 필터 등 추가
const upload = multer({
    storage: storage,
});

module.exports = upload;
