import React from "react";
import styles from "./MainLayout.module.css";

const MainLayout = ({ historyContent, mainContent, inputContent }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.history}>{historyContent}</div>
      <div className={styles.chat_window}>{mainContent}</div>
      <div className={styles.input_window}>{inputContent}</div>
    </div>
  );
};

export default MainLayout;
