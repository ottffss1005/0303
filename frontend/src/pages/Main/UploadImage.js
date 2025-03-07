// UploadImage.js
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ImgUpload.module.css";
import ChatBubble from "./ChatBubble";

const UploadImage = ({ onUploadComplete, selectedOption }) => {
  const { userUploadPhoto } = useAuth();
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = { type: "image", content: reader.result, sender: "user" };
      setMessages((prev) => [...prev, newImage]);
    };
    reader.readAsDataURL(file);

    await userUploadPhoto(file);

    console.log("업로드 완료!");
    setIsUploaded(true);
    // 파일 업로드 완료 시 파일 객체도 함께 전달
    onUploadComplete(true, file);
  };

  useEffect(() => {
    if (selectedOption) {
      const optionsMap = {
        analyze: "이 사진을 분석하고 싶어요",
        chooseAnother: "다른 사진을 고르고 싶어요",
        cancel: "취소할래요",
      };

      const userMessage = { type: "text", content: optionsMap[selectedOption], sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
    }
  }, [selectedOption]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <ChatBubble key={index} message={msg.content} sender={msg.sender} type={msg.type} />
          ))
        ) : (
          <div className={styles.placeholder}>
            SNS에 업로드할 사진을 추가하세요 📷
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        {messages.length === 0 && (
          <button className={styles.uploadButton} onClick={() => fileInputRef.current.click()}>
            📁 사진 선택
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadImage;
