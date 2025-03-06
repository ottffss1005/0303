import React, { useState, useEffect } from "react";
import Layout from "../../layouts/MainLayout";
import UploadImage from "./UploadImage";
import InputBnt from "./InputBnt";
import { sendQuestion, getUserProfile } from "../../api/auth.api"; // API 호출 함수 가져오기

const Main = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userId, setUserId] = useState(null); // 현재 로그인한 유저 ID 저장

  // 유저 ID 가져오기 (처음 한 번 실행)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserId(profile.userId); // 유저 ID 저장
      } catch (error) {
        console.error("유저 정보 가져오기 실패:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // 선택한 옵션 처리
  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setIsUploaded(false); // 선택 후 InputBnt 제거

    const questionMap = {
      analyze: { id: 1, text: "이 사진을 분석하고 싶어요" },
      chooseAnother: { id: 2, text: "다른 사진을 고르고 싶어요" },
    };

    if ((option === "analyze" || option === "chooseAnother") && userId) {
      const { id, text } = questionMap[option];

      try {
        const response = await sendQuestion(id, text, userId); // 현재 유저 ID 자동 반영
        console.log("질문 전송 성공:", response);
      } catch (error) {
        console.error("질문 전송 실패:", error);
      }
    }
  };

  return (
    <div>
      <Layout
        mainContent={<UploadImage onUploadComplete={setIsUploaded} selectedOption={selectedOption} />}
        inputContent={isUploaded ? <InputBnt onSelect={handleOptionSelect} /> : null}
      />
    </div>
  );
};

export default Main;
