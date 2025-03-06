import React from "react";
import styles from "./Layout.module.css";
import SideMenu from "../components/Nav";

const layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <br />
      </header>
      <aside className={styles.sidebar}>
        <SideMenu />
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default layout;
