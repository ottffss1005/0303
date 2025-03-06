import { httpClient } from "./http";
import { getToken } from "../store/authStore";

export const signup = async (userData) => {
  const response = await httpClient.post("/api/register", userData);
  return response.data;
};

export const login = async (data) => {
  const response = await httpClient.post("/api/login", data);
  return response.data;
};

// ✅ 사용자 프로필 정보 가져오기
export const getUserProfile = async () => {
  const token = getToken();
  console.log("🔍 저장된 토큰 (사용자 프로필 요청):", token); // ✅ 토큰 확인

  const response = await httpClient.get("/api/profile", {
    headers: { Authorization: token ? `Bearer ${token}` : "" }, // 🔥 토큰 추가 (null 방지)
  });

  return response.data;
};

// ✅ 업로드한 사진 리스트 가져오기
export const getUserPhotos = async () => {
  const token = getToken();
  console.log("📸 저장된 토큰 (사진 요청):", token); // ✅ 토큰 확인

  const response = await httpClient.get("/api/photos", {
    headers: { Authorization: token ? `Bearer ${token}` : "" }, // 🔥 토큰 추가
  });

  return response.data.photos;
};

export const uploadPhoto = async (data) => {
  try {
    const token = getToken();
    console.log("업로드 요청 전 토큰 확인:", token);

    const response = await httpClient.post("/api/photos", data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    console.log("업로드 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "사진 업로드 실패 (403 가능성):",
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
};

// 비밀번호 변경 API
export const updateUserPassword = async (newPassword) => {
  const token = getToken();

  const response = await httpClient.put("/api/profile", 
    { userPw: newPassword }, // 변경할 비밀번호 전달
    {
      headers: { Authorization: `Bearer ${token}` }, // 토큰 추가
    }
  );

  return response.data;
};
