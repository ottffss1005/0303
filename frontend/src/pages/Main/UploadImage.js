import React, { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ImgUpload.module.css";
import ChatBubble from "./ChatBubble";
import AIquestion from "./AIquestion";

const ImgUpload = () => {
  const { userUploadPhoto } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  // 사용자가 파일을 선택하면 자동 업로드
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 미리보기 이미지 추가
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage({ type: "image", content: reader.result, sender: "user" });
    };
    reader.readAsDataURL(file);

    // 서버에 업로드 실행
    const uploadedUrl = await userUploadPhoto(file);
    if (uploadedUrl) {
      setUploadedImage({ type: "image", content: uploadedUrl, sender: "server" });
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {uploadedImage ? (
          <ChatBubble message={uploadedImage.content} sender={"user"} type={uploadedImage.type} />
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
        {!uploadedImage && ( // 업로드되면 버튼을 숨김
          <button className={styles.uploadButton} onClick={() => fileInputRef.current.click()}>
            📁 사진 선택
          </button>
        )}
        {uploadedImage && (
                <AIquestion/>
        )}
      </div>
    </div>
  );
};

export default ImgUpload;
