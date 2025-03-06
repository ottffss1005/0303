const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

  jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
    if (err) return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
    //검증 성공하면 req.user에 사용자 데이터 저장
    req.user = userData;
    next();
  });
};

module.exports = authenticateToken;