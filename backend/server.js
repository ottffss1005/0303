require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

console.log("process.env.MONGO_URI 값 확인:", process.env.MONGO_URI);

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads",express.static("uploads"))


// 기본 라우트
app.get('/', (req, res) => {
  res.send('Backend Server Running');
});


// // 정적 파일 제공 설정
// app.use(express.static(path.join(__dirname, '../frontend')));

// // /main 경로 정의
// app.get('/main', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend', 'main.html'));
// });


// 라우터 등록
// const memberR
// outer = require('./routes/member'); //member라우터 가져오기
// const userRouter = require('./routes/user'); //user라우터 가져오기
// const taskRouter = require('./routes/task');
// const groupRouter = require('./routes/group');

// app.use('/api', memberRouter); //member라우터 등록
// app.use('/api', userRouter); //user라우터 등록
// app.use('/api', taskRouter); //task 라우터 등록
// app.use('/api', groupRouter);


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

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server Running: http://localhost:${PORT}`);
});

//로그인 엔드포인트
//app.post()

require('dotenv').config({ path: __dirname + '/.env' });

console.log("현재 작업 디렉토리:", process.cwd());
console.log("환경 변수 로드 확인:", process.env.MONGO_URI);