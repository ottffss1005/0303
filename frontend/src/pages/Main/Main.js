import React, { useState } from "react";
import Layout from "../../layouts/MainLayout";
import UploadImage from "./UploadImage";
import InputBnt from "./InputBnt";

const Main = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsUploaded(false); // 선택 후 InputBnt 제거
  };

  return (
    <div>
      <Layout
        mainContent={<UploadImage onUploadComplete={setIsUploaded} selectedOption={selectedOption} />}
        inputContent={isUploaded ? <InputBnt onSelect={handleOptionSelect} /> : null}
      />
    </div>
  );
};

export default Main;
