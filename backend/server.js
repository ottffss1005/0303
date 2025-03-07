require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Analysis = require('./models/analysis'); // Analysis 모델 가져오기

//console.log("process.env.MONGO_URI 값 확인:", process.env.MONGO_URI);

const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");

//미들웨어 설정
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//기본 라우트
app.get('/', (req, res) => {
  res.send('Backend Server Running');
});

// DB 연결 
const mongoose = require('mongoose');
mongoose
  .connect(process.env.MONGO_URI, { 
    }
)

  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('DB Connection Error:', err));

//로그인 라우터
const authRouter = require("./routes/auth");
app.use("/api", authRouter);

// 사진 업로드 라우터
const photoRouter = require("./routes/photo");
app.use("/api", photoRouter);

//질문, 답변 라우터
const questionRouter = require("./routes/question");
app.use("/api", questionRouter);

const answerRouter = require("./routes/answer");
app.use("/api", answerRouter);

//히스토리 라우터
const historyRouter = require("./routes/history");
app.use("/api", historyRouter);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server Running: http://localhost:${PORT}`);
});


require('dotenv').config({ path: __dirname + '/.env' });
