const express = require("express");
const router = express.Router();
const Analysis = require("../models/analysis");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; 

    const historyData = await Analysis.find({ userId: userId })
    .select("photoId extracted_text risk_score risk_level risk_details historical_inference_possible historical_inference_details photoName photoUrl created_at")
    .sort({ created_at: -1 });

    if (!historyData || historyData.length === 0) {
      return res.status(404).json({ message: "히스토리 데이터가 없습니다." });
    }

    res.status(200).json({
      message: "히스토리 데이터 조회 성공",
      history: historyData
    });
  } catch (error) {
    console.error("히스토리 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;