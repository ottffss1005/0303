import React from 'react';
import { Link } from 'react-router-dom';

const Mypage= () => {
  return (
    <div>
      <h1>My 페이지</h1>
      <Link to="/Home">홈으로 이동</Link>
    </div>
  );
};

export default Mypage;