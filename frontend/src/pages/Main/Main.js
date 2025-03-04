import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../layouts/MainLayout";
import ImgUpload from "./ImgUpload";
import UploadImage from "./UploadImage";
const Main = () => {
  return (
    <div>
      <Layout mainContent={<UploadImage></UploadImage>} />
    </div>
  );
};

export default Main;
