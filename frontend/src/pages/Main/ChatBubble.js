import React from "react";
import styles from "./ChatBubble.module.css";

const ChatBubble = ({ message, sender, type }) => {
  const isUser = sender === "user"; // 사용자 메시지인지 판별

  return (
    <div className={`${styles.bubbleContainer} ${isUser ? styles.user : styles.bot}`}>
      {!isUser && <div className={styles.botIcon}>AI</div>}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {type === "image" ? (
          <img src={message} alt="업로드된 이미지" className={styles.image} />
        ) : (
          message
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
