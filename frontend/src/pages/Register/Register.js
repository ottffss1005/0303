import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Register.module.css";

const Register = () => {
  const [userData, setUserData] = useState({
    email: "",
    id: "",
    passwd: "",
    passwdCheck: "",
  });

  const handleInput = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const { id, passwd, passwdCheck } = userData;

  const isSame = passwd === passwdCheck;
  const isValid = id !== "" && isSame === true;

  return (
    <div>
      <form className={styles.registerForm}>
        <div>
          <h1 className={styles.register_title}>회원가입</h1>
        </div>
        <div>
          <div className={styles.input}>
            <input
              type="text"
              className={styles.userId}
              id="userId"
              placeholder="아이디"
              value={userData.id}
              autoFocus
            ></input>
            <input
              type="password"
              className={styles.password}
              id="userPassword"
              placeholder="비밀번호"
              value={userData.passwd}
            ></input>
            <input
              type="password"
              className={styles.password}
              id="userPassword"
              placeholder="비밀번호 확인"
              value={userData.passwdCheck}
            ></input>
            <input
              type="text"
              className={styles.userId}
              id="Email"
              placeholder="이메일"
              value={userData.email}
            ></input>
            <button
              className={styles.registerBut}
              disabled={isValid ? false : true}
            >
              Register
            </button>
          </div>
        </div>
        <div className={styles.link}>
          <Link to="/login">로그인으로 돌아가기기</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
