const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
    photoId: { type: String, required: true, unique: true }, // 사진 ID (고유값)
    embedding: { type: String, }, 
    extracted_text: { type: String, default: "" },
    risk_score: { type: Number, required: true }, //위험 점수
    risk_level: { type: String, required: true }, //위험 수준
    risk_details: { type: [String], default: [] }, //위험 세부사항 (배열)
    historical_inference_possible: { type: Boolean, default: false }, //과거 데이터 유추 가능 여부
    historical_inference_details: { type: [String], default: [] }, //과거 유추 정보 (배열)
    userId: { type: String, required: true }, //사용자 ID
    snsApi: { type: Boolean, default: false }, //SNS API 사용 여부
    photoName: { type: String, required: true }, //원본 파일 이름
    photoUrl: { type: String, required: true }, //업로드된 사진 URL
    created_at: { type: Date, default: Date.now } //생성 날짜
});

const Analysis = mongoose.model("Analysis", analysisSchema,"analysis");

module.exports = Analysis;
