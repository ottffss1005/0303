import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Register.module.css";
import { useAuth } from "../../hooks/useAuth";

const Register = () => {
  const { userSignup } = useAuth();
  const [formData, setFormData] = useState({
    userEmail: "",
    userId: "",
    userPw: "",
    passwdCheck: "",
  });
  const [error, setError] = useState(""); // 에러 메시지 상태 추가

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.userPw !== formData.passwdCheck) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");

    // FormData 대신 명확히 JSON 객체로 전달
    const signupData = {
      userEmail: formData.userEmail,
      userId: formData.userId,
      userPw: formData.userPw,
    };

    userSignup(signupData);
  };

  return (
    <div>
      <form className={styles.registerForm} onSubmit={handleSubmit}>
        <div>
          <h1 className={styles.register_title}>회원가입</h1>
        </div>
        <div>
          <div className={styles.input}>
            <input
              type="text"
              className={styles.userId}
              id="userId"
              name="userId"
              placeholder="아이디"
              value={formData.userId}
              onChange={handleChange}
              autoFocus
            />
            <input
              type="password"
              className={styles.password}
              id="userPw"
              name="userPw"
              placeholder="비밀번호"
              value={formData.userPw}
              onChange={handleChange}
            />
            <input
              type="password"
              className={styles.password}
              id="passwdCheck"
              name="passwdCheck"
              placeholder="비밀번호 확인"
              value={formData.passwdCheck}
              onChange={handleChange}
            />
            <input
              type="text"
              className={styles.userId}
              id="userEmail"
              name="userEmail"
              placeholder="이메일"
              value={formData.userEmail}
              onChange={handleChange}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.registerBut} type="submit">
              Register
            </button>
          </div>
        </div>
        <div className={styles.link}>
          <Link to="/login">로그인으로 돌아가기</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;