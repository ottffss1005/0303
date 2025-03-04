import React, { useState, useRef } from "react";
import styles from "./ImgUpload.module.css";
import ChatBubble from "./ChatBubble";

const ImgUpload = () => {
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);

  const addImageFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessages([
          ...messages,
          { type: "image", content: reader.result, sender: "user" },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

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
          onChange={addImageFile}
          className={styles.hiddenInput}
        />
        <button className={styles.uploadButton} onClick={handleUploadClick}>
          📁 파일 선택
        </button>
      </div>
    </div>
  );
};

export default ImgUpload;
