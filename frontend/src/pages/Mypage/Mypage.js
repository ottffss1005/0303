import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, getUserPhotos, updateUserPassword } from "../../api/auth.api";
import styles from "./Mypage.module.css";

const MyPage = () => {
    const [user, setUser] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState(null);
    const [newPassword, setNewPassword] = useState(""); // 🔥 새 비밀번호 입력 필드 추가
    const [updateMessage, setUpdateMessage] = useState(""); // 🔥 업데이트 성공 메시지 추가
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userInfo, userPhotos] = await Promise.all([
                    getUserProfile(), // ✅ 사용자 정보 가져오기 추가
                    getUserPhotos()
                ]);

                console.log("✅ 사용자 정보 가져오기 성공:", userInfo);
                console.log("✅ 사진 리스트 가져오기 성공:", userPhotos);

                setUser(userInfo);
                setPhotos(userPhotos || []);
            } catch (error) {
                console.error("❌ 데이터 가져오는 중 오류 발생:", error.response?.status, error.response?.data);
                setError(error.response?.data?.message || "데이터를 가져오는 중 오류가 발생했습니다.");
            }
        };
        fetchData();
    }, []);

    // 📌 비밀번호 업데이트 핸들러 추가
    const handlePasswordChange = async () => {
        if (!newPassword.trim()) {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }

        try {
            const result = await updateUserPassword(newPassword);
            console.log("✅ 비밀번호 변경 성공:", result);
            setUpdateMessage("비밀번호가 성공적으로 변경되었습니다.");
            setNewPassword(""); // 입력 필드 초기화
        } catch (error) {
            console.error("❌ 비밀번호 변경 오류:", error.response?.data?.message);
            setUpdateMessage("비밀번호 변경에 실패했습니다.");
        }
    };

    return (
        <div className={styles.container}>
            {error ? (
                <p className={styles.errorText}>❌ {error}</p>
            ) : user ? (  // ✅ user가 존재할 때만 화면 표시
                <>
                    <div className={styles.profileSection}>
                        <h2>아이디: {user.userId}</h2>
                        <p>이메일: {user.userEmail}</p>
                    </div>

                    {/* 📌 비밀번호 변경 UI 추가 */}
                    <div className={styles.passwordSection}>
                        <h3>비밀번호 변경</h3>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="새 비밀번호 입력"
                            className={styles.passwordInput}
                        />
                        <button
                            onClick={handlePasswordChange} // ✅ 함수 정상 연결
                            className={styles.updateButton}
                        >
                            변경하기
                        </button>
                        {updateMessage && (
                            <p className={styles.successMessage}>{updateMessage}</p>
                        )}
                    </div>

                    <div className={styles.photoSection}>
                        <h3>내가 업로드한 사진</h3>
                        {photos.length > 0 ? (  // ✅ 빈 배열일 경우 "업로드한 사진이 없습니다." 출력
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
