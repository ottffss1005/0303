const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  //"Bearer <token>" 형태로 전송됨
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

  jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
    if (err) return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
    //검증 성공시 req.user에 사용자 데이터를 저장 (예: { userId: '사용자아이디' })
    req.user = userData;
    next();
  });
};

module.exports = authenticateToken;