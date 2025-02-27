import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>홈 페이지</h1>
      <p>여기는 홈 페이지입니다.</p>
      <Link to="/Login">로그인하러가기</Link>
    </div>
  );
};

export default Home;
