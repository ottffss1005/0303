import React, { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ImgUpload.module.css";
import ChatBubble from "./ChatBubble";

const ImgUpload = () => {
  const { userUploadPhoto } = useAuth();
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);

  // 사용자가 파일을 선택하면 자동 업로드
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 미리보기 이미지 추가
    const reader = new FileReader();
    reader.onloadend = () => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "image", content: reader.result, sender: "user" }, // 미리보기 추가
      ]);
    };
    reader.readAsDataURL(file);

    // 서버에 업로드 실행
    const uploadedUrl = await userUploadPhoto(file);
    if (uploadedUrl) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "image", content: uploadedUrl, sender: "server" }, // 업로드된 이미지 URL 추가
      ]);
    }
  };

  // 파일 선택 트리거
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <ChatBubble
              key={index}
              message={msg.content}
              sender={msg.sender}
              type={msg.type}
            />
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
        <button className={styles.uploadButton} onClick={handleUploadClick}>
          📁 사진 선택
        </button>
      </div>
    </div>
  );
};

export default ImgUpload;
