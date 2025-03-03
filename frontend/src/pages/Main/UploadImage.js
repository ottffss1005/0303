import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function UploadImage() {
  const { userUploadPhoto } = useAuth();
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택하세요.");
      return;
    }

    const uploadedUrl = await userUploadPhoto(file);
    if (uploadedUrl) {
      alert("업로드 성공! 이미지 URL: ${uploadedUrl}");
    }
  };

  return (
    <div className="p-4">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} className="mt-2 p-2 bg-blue-500 text-white">
        사진 업로드
      </button>
    </div>
  );
}
