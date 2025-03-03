import {React, useState} from "react";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";
import {useAuth} from "../../hooks/useAuth";

const Login = () => {

  const { userLogin } = useAuth();
  const [formData, setFormData] = useState({
    userId: "",
    userPw: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    userLogin(formData);
  };

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <div>
          <h1 className={styles.login_title}>로그인</h1>
        </div>
        <div>
          <div className={styles.input}>
            <input
              type="text"
              name="userId"
              className={styles.userId}
              id="userId"
              placeholder="아이디"
              autoFocus
              value={formData.userId}
              onChange={handleChange}
            ></input>
            <input
              type="password"
              name="userPw"
              className={styles.password}
              id="userPw"
              placeholder="비밀번호"
              value={formData.userPw}
              onChange={handleChange}
            ></input>
            <button type="submit" className={styles.loginBut}>Login</button>
          </div>
        </div>
        <div className={styles.link}>
          <Link to="/register">회원가입</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
