const express = require("express");
const router = express.Router();
const Answer = require("../models/answer");
const Photo = require("../models/photo");
const Analysis = require("../models/analysis");
const authenticateToken = require("../middleware/authenticateToken");

//클라이언트가 questionid 및 다른 정보를 전송하면 서버가 해당 질문에 대한 답변을 서버에 저장장
router.get("/answer", authenticateToken, async (req, res) => {
  try {
    console.log("GET /api/answer 라우트 진입");  // [디버그 로그 1]
    const { photoId } = req.query;
    const userId = req.user.userId; 

    console.log("photoId:", photoId);            // [디버그 로그 2]
    console.log("userId (from token):", userId); // [디버그 로그 3]

    if (!photoId) {
      console.log("photoId 없음, 400 반환");      // [디버그 로그 4]
      return res.status(400).json({ message: "photoId가 필요합니다." });
    }

    //MongoDB에서 photoId와 userId가 모두 일치하는 analysis 데이터
    console.log("Analysis.findOne 호출 전");      // [디버그 로그 5]
    const analysisData = await Analysis.findOne({ photoId: photoId, userId: userId });
    console.log("Analysis.findOne 호출 후");       // [디버그 로그 6]

    //데이터 없으면
    if (!analysisData) {
      console.log("analysisData 없음, 404 반환"); // [디버그 로그 7]
      return res.status(404).json({ message: "해당 사진의 분석 데이터를 찾을 수 없습니다." });
    }

    console.log("analysisData 있음, 200 반환");    // [디버그 로그 8]
    res.status(200).json({
        photoId: analysisData.photoId,
        extractedText: analysisData.extracted_text,
        riskScore: analysisData.risk_score,
        riskLevel: analysisData.risk_level,
        riskDetails: analysisData.risk_details,
        photoUrl: analysisData.photoUrl,
        historical_inference_possible: analysisData.historical_inference_possible,
        historical_inference_details: analysisData.historical_inference_details,
        createdAt: analysisData.created_at,
    });

} catch (error) {
    console.error("분석 데이터 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
}
});

module.exports = router;
