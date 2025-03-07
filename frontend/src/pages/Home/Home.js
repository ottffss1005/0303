import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

import Img1 from "../../assets/images/homeImg1.jpg";
import Img2 from "../../assets/images/homeImg2.jpg";
import Img3 from "../../assets/images/homeImg3.jpg";
import Img4 from "../../assets/images/homeImg4.jpg";

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.textContainer}>
        <h2>
          <light>이미지</light>나 <light>피드</light>를 공유하기 전<br />
          확인해 보세요
        </h2>
        <p>
          사진 혹은 피드에 민감한 정보가 포함되어 있지는 않을까
          <br />
          고민한 경험이 있으신가요?
          <br />
          <br />
          이미지를 업로드하기 전 위험도를 측정해 보세요.
          <br />
          SNS를 연동하고 내 계정의 위험도를 측정해 보세요.
        </p>
        <Link to="/Login">로그인하러가기</Link>
      </div>

      <br />
      <div className={styles.imageContainer}>
        <img src={Img1} alt="img1" />
        <br />
        <img src={Img2} alt="img2" />
        <img src={Img3} alt="img3" />
        <img src={Img4} alt="img4" />
      </div>
    </div>
  );
};

export default Home;
