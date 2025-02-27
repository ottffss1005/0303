import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../layouts/MainLayout";
import ImgUpload from './ImgUpload';

const Main = () => {
  return (
    <div>
      <Layout
      mainContent={
        <ImgUpload/>
      }
      />
    </div>
  );
};

export default Main;
