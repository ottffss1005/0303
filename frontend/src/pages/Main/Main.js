import React, { useState } from "react";
import Layout from "../../layouts/MainLayout";
import UploadImage from "./UploadImage";
import InputBnt from "./InputBnt";

const Main = () => {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div>
      <Layout
        mainContent={<UploadImage onUploadComplete={setIsUploaded} />}
        inputContent={isUploaded ? <InputBnt /> : null} 
      />
    </div>
  );
};

export default Main;
