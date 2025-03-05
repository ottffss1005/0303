import React, { useState, useEffect } from "react";
import { getUserProfile, getUserPhotos } from "../../api/auth.api";
import styles from "./Mypage.module.css";

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  // 📌 사용자 정보 + 사진 리스트 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userInfo, userPhotos] = await Promise.all([
          getUserProfile(),
          getUserPhotos(),
        ]);
        console.log("✅ 사용자 정보 가져오기 성공:", userInfo);
        console.log("✅ 사진 리스트 가져오기 성공:", userPhotos);

        setUser(userInfo);
        setPhotos(userPhotos);
      } catch (error) {
        console.error(
          "❌ 데이터 가져오는 중 오류 발생:",
          error.response?.status,
          error.response?.data
        );
        setError(
          error.response?.data?.message ||
            "데이터를 가져오는 중 오류가 발생했습니다."
        );
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      {error ? (
        <p className={styles.errorText}>❌ {error}</p>
      ) : user ? (
        <>
          <div className={styles.profileSection}>
            <h2>아이디: {user.userName}</h2>
            <p>이메일: {user.userEmail}</p>
          </div>

          <div className={styles.photoSection}>
            <h3>내가 업로드한 사진</h3>
            {photos.length > 0 ? (
              <div className={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5000${photo.photoUrl}`}
                    alt="Uploaded"
                    className={styles.uploadedImage}
                  />
                ))}
              </div>
            ) : (
              <p>업로드한 사진이 없습니다.</p>
            )}
          </div>
        </>
      ) : (
        <p>로딩 중...</p>
      )}
    </div>
  );
};

export default MyPage;
