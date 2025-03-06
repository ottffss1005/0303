import React from "react";
import styles from "./InputBnt.module.css";

const InputBnt = ({ onSelect }) => {
  return (
    <div className={styles.container}>
      <div className={styles.option} onClick={() => onSelect("analyze")}>
        📊 이 사진을 분석하고 싶어요.
      </div>
      <div className={styles.option} onClick={() => onSelect("chooseAnother")}>
        🖼 다른 사진을 고르고 싶어요.
      </div>
      <div className={styles.option} onClick={() => onSelect("cancel")}>
        ❌ 취소할래요.
      </div>
    </div>
  );
};

export default InputBnt;
