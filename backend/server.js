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


//정적 파일 제공 설정
//app.use(express.static(path.join(__dirname, '../frontend')));

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



  // function insertAnalysisData() {
  //   // Analysis 문서 생성
  //   const analysisData = new Analysis({
  //     photoId: "fde23913",
  //     embedding: "0.03445206955075264,0.015389281325042248,0.0,0.011065158061683178,0.00...", // 예시 문자열
  //     extracted_text: "ROOM 4\n① 롯데장학재단\n1호자\n4조\n이경진\n고려대학교\n41기 희미\n동국대학교\n최원영\n41기 희망장학생\n4조\n1호차\n41기…",
  //     risk_score: 70,
  //     risk_level: "높음",
  //     risk_details: ["상세정보1", "상세정보2"],
  //     historical_inference_possible: false,
  //     historical_inference_details: [],
  //     userId: "gamgooma",
  //     snsApi: false,
  //     photoName: "original.jpg",
  //     photoUrl: "/uploads/original.jpg",
  //     created_at: new Date()
  //   });
  
  //   // 문서 저장
  //   analysisData.save()
  //     .then((doc) => {
  //       console.log("Analysis 데이터 삽입 성공:", doc);
  //       mongoose.disconnect();
  //     })
  //     .catch((err) => {
  //       console.error("데이터 삽입 오류:", err);
  //       mongoose.disconnect();
  //     });
  // }


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

console.log("현재 작업 디렉토리:", process.cwd());
console.log("환경 변수 로드 확인:", process.env.MONGO_URI);