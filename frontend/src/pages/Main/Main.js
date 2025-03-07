// Main.js
import React, { useState, useEffect } from "react";
import Layout from "../../layouts/MainLayout";
import UploadImage from "./UploadImage";
import InputBnt from "./InputBnt";
import { sendQuestion, getUserProfile, analyzeImage, getAIAnswer } from "../../api/auth.api";

const Main = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userId, setUserId] = useState(null); // 현재 로그인한 유저 ID 저장

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserId(profile.userId);
      } catch (error) {
        console.error("유저 정보 가져오기 실패:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // helper: 간단한 photoId 생성 함수 (필요 시 서버에서 생성할 수도 있음)
  const generatePhotoId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  // 선택한 옵션 처리
  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setIsUploaded(false); // 선택 후 InputBnt 제거

    const questionMap = {
      analyze: { id: 1, text: "이 사진을 분석하고 싶어요" },
      chooseAnother: { id: 2, text: "다른 사진을 고르고 싶어요" },
    };

    if (option === "analyze" && userId) {
      if (!uploadedFile) {
        console.error("분석할 파일이 없습니다.");
        return;
      }
      const photoId = generatePhotoId();
      const formData = new FormData();
      formData.append("image", uploadedFile);
      console.log(uploadedFile);
      formData.append("photoId", photoId);
      console.log(photoId);
      formData.append("userId", userId);
      console.log(userId);
      try {
        const response = await analyzeImage(formData);
        console.log("분석 결과:", response);

        await new Promise((resolve) => setTimeout(resolve, 5000));
        const answerResponse = await getAIAnswer(photoId);
        console.log("Risk Level:", answerResponse.riskLevel);
        console.log("Risk Level:", answerResponse.extractedText);
        console.log("Risk Level:", answerResponse.riskScore);
        console.log("Risk Level:", answerResponse.createdAt);
        // 분석 결과에 따른 UI 업데이트 처리를 여기에 추가할 수 있습니다.
      } catch (error) {
        console.error("분석 요청 실패:", error);
      }
    } else if (option === "chooseAnother" && userId) {
      const { id, text } = questionMap[option];
      try {
        const response = await sendQuestion(id, text, userId);
        console.log("질문 전송 성공:", response);
      } catch (error) {
        console.error("질문 전송 실패:", error);
      }
    }
  };

  return (
    <div>
      <Layout
        mainContent={
          <UploadImage
            onUploadComplete={(uploaded, file) => { 
              setIsUploaded(uploaded); 
              setUploadedFile(file); 
            }}
            selectedOption={selectedOption}
          />
        }
        inputContent={isUploaded ? <InputBnt onSelect={handleOptionSelect} /> : null}
      />
    </div>
  );
};

export default Main;
