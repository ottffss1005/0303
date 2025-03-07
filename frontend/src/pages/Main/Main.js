// Main.js
import React, { useState, useEffect } from "react";
import Layout from "../../layouts/MainLayout";
import UploadImage from "./UploadImage";
import InputBnt from "./InputBnt";
import ChatBubble from "./ChatBubble";
import { sendQuestion, getUserProfile, analyzeImage, getAIAnswer, blurImage } from "../../api/auth.api";

const Main = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userId, setUserId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

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

  const generatePhotoId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setIsUploaded(false);

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
      formData.append("photoId", photoId);
      formData.append("userId", userId);

      try {
        const response = await analyzeImage(formData);
        console.log("분석 결과:", response);

        await new Promise((resolve) => setTimeout(resolve, 5000));
        const answerResponse = await getAIAnswer(photoId);
        console.log("AI 응답:", answerResponse);
        setAnalysisResult(answerResponse);
      } catch (error) {
        console.error("분석 요청 실패:", error);
      }
    } else if (option === "chooseAnother" && userId) {
      window.location.reload();
    }
  };

  // 블러 처리 버튼 클릭 시 호출되는 함수
  const handleBlurClick = async () => {
    if (!analysisResult) return;
    try {
      console.log("photoId:", analysisResult.photoId);
      const blurResponse = await blurImage(analysisResult.photoId);
      console.log("블러 처리 결과:", blurResponse);
  
      // blob 데이터를 URL로 변환
      const blobUrl = window.URL.createObjectURL(blurResponse);
      // 다운로드용 링크 생성
      const link = document.createElement("a");
      link.href = blobUrl;
      // 파일 이름은 photoId_blur.jpg로 지정 (원하는 이름으로 변경 가능)
      link.setAttribute("download", `${analysisResult.photoId}_blur.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // 사용 후 blob URL 해제
      window.URL.revokeObjectURL(blobUrl);
  
      alert("이미지 블러 처리가 완료되었습니다. 파일이 다운로드 됩니다.");
    } catch (error) {
      console.error("블러 처리 실패:", error);
      alert("블러 처리에 실패했습니다.");
    }
  };

  return (
    <div>
      <Layout
        mainContent={
          <>
            <UploadImage
              onUploadComplete={(uploaded, file) => {
                setIsUploaded(uploaded);
                setUploadedFile(file);
              }}
              selectedOption={selectedOption}
            />
            {analysisResult && (
              <>
                <ChatBubble
                  message={
                    `분석 결과입니다.\n\n` +
                    `Risk Level: ${analysisResult.riskLevel}\n` +
                    `Risk Score: ${analysisResult.riskScore}\n` +
                    `Risk Details:\n${(analysisResult.riskDetails || []).join("\n")}`
                  }
                  sender="bot"
                  type="text"
                />
                <button
                  onClick={handleBlurClick}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    backgroundColor: "#0F4C2E",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  블러 처리
                </button>
              </>
            )}
          </>
        }
        inputContent={isUploaded ? <InputBnt onSelect={handleOptionSelect} /> : null}
      />
    </div>
  );
};

export default Main;
