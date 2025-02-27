import React from "react";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  return (
    <div>
      <form className={styles.loginForm}>
        <div>
          <h1 className={styles.login_title}>로그인</h1>
        </div>
        <div>
          <div className={styles.input}>
            <input
              type="text"
              className={styles.userId}
              id="userId"
              placeholder="아이디"
              autoFocus
            ></input>
            <input
              type="password"
              className={styles.password}
              id="userPassword"
              placeholder="비밀번호"
            ></input>
            <button className={styles.loginBut}>Login</button>
          </div>
        </div>
        <div className={styles.link}>
          <Link to="/register">회원가입</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
