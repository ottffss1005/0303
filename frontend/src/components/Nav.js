import { Link } from "react-router-dom";
import React from "react";
import styles from "./Nav.module.css";

import logo from "../assets/images/logo/logo1.png";
import mainIcon from "../assets/images/icon/chat.png";
import mypageIcon from "../assets/images/icon/human.png";
import settingsIcon from "../assets/images/icon/settings.png";

function Nav() {
  return (
    <div className={styles.nav_box}>
      <img src={logo} alt="logo" className={styles.logo} />
      <Link className={styles.nav_text} to={"/Main"}>
        <img src={mainIcon} alt="main icon" className={styles.nav_icon} />
        메인화면
      </Link>
      <Link className={styles.nav_text} to={"/Mypage"}>
        <img src={mypageIcon} alt="mypage icon" className={styles.nav_icon} />
        내페이지
      </Link>
      <Link className={styles.nav_text} to={"/Settings"}>
        <img
          src={settingsIcon} alt="settings icon" className={styles.nav_icon}
        />
        환경설정
      </Link>
      <button className={styles.logout_button}>로그아웃</button>
    </div>
  );
}

export default Nav;
