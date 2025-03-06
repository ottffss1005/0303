const express = require("express");
const router = express.Router();
const Question = require("../models/question");
const authenticateToken = require("../middleware/authenticateToken");

router.post("/question", authenticateToken, async (req, res) => {
  try {
    //{"questionId": "Q001","questionText": "어떤 의미인가요?" }
    const { questionId, questionText } = req.body;
    const userIdFromToken = req.user.userId;

    const newQuestion = new Question({
      questionId,       
      questionText,
      userId: userIdFromToken,
    });

    await newQuestion.save();

    res.status(201).json({
      message: "질문이 등록되었습니다.",
      questionId: newQuestion.questionId,
    });
  } catch (error) {
    console.error("질문 등록 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
