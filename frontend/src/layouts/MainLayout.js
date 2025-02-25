import React from "react";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.history}></div>
      <div className={styles.chat_window}></div>
      <div className={styles.input_window}></div>
    </div>
  );
};

export default MainLayout;
