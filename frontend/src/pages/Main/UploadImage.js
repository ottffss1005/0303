import React, { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ImgUpload.module.css";
import ChatBubble from "./ChatBubble";
import AIquestion from './AIquestion';

const ImgUpload = ({ onUploadComplete }) => {
  const { userUploadPhoto } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);

    await userUploadPhoto(file);

    console.log("📢 업로드 완료!"); // 업로드 성공 로그
    onUploadComplete(true); // 상태 변경
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {uploadedImage ? (
          <ChatBubble message={uploadedImage} sender={"user"} type="image" />
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
        {!uploadedImage && (
          <button className={styles.uploadButton} onClick={() => fileInputRef.current.click()}>
            📁 사진 선택
          </button>
        )}
        {uploadedImage && <AIquestion/>}
      </div>
    </div>
  );
};

export default ImgUpload;
