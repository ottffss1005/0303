import React from 'react';
import { Link } from 'react-router-dom';

const Main = () => {
  return (
    <div>
      <h1>Main 페이지</h1>
      <p>이 페이지는 소개 페이지입니다.</p>
      <Link to="/">홈으로 이동</Link>
    </div>
  );
};

export default Main;
