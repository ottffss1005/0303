import React from "react";
import styles from "./ChatBubble.module.css";

const ChatBubble = ({ message, sender, type }) => {
  const isUser = sender === "user";

  return (
    <div className={`${styles.bubbleContainer} ${isUser ? styles.user : styles.bot}`}>
      {!isUser && <div className={styles.botIcon}>AI</div>}
      <div className={styles.bubbleWrapper}>
        {type === "image" ? (
          <img src={message} alt="업로드된 이미지" className={styles.image} />
        ) : (
          <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
