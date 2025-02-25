import React from "react";
import styles from "./Layout.module.css";
import SideMenu from "../components/Nav";

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>헤더 영역</header>
      <aside className={styles.sidebar}>
        <SideMenu />
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default Layout;
