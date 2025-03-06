import { httpClient } from "./http";
import { getToken } from "../store/authStore";

// 회원가입
export const signup = async (userData) => {
  const response = await httpClient.post("/api/register", userData);
  return response.data;
};

// 로그인
export const login = async (data) => {
  const response = await httpClient.post("/api/login", data);
  return response.data;
};

// 사용자 프로필 정보 가져오기
export const getUserProfile = async () => {
  const token = getToken();

  const response = await httpClient.get("/api/profile", {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  return response.data;
};

// 업로드한 사진 리스트 가져오기
export const getUserPhotos = async () => {
  const token = getToken();

  const response = await httpClient.get("/api/photos", {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  return response.data.photos;
};

// 사진 업로드
export const uploadPhoto = async (data) => {
  const token = getToken();

  try {
    const response = await httpClient.post("/api/photos", data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    console.log("사진 업로드 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error("사진 업로드 실패:", error.response?.status, error.response?.data);
    throw error;
  }
};

// 비밀번호 변경
export const updateUserPassword = async (newPassword) => {
  const token = getToken();

  const response = await httpClient.put(
    "/api/profile",
    { userPw: newPassword },
    {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    }
  );

  return response.data;
};

// 사용자가 선택한 질문을 서버로 전송
export const sendQuestion = async (photoId, questionId, questionText, userId) => {
  const token = getToken();

  const response = await httpClient.post(
    "/api/question",
    { questionId, questionText, userId },
    {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    }
  );

  return response.data;
};

// 서버에서 AI 답변을 받아오기
export const getAIAnswer = async (imageId, questionId) => {
  const token = getToken();

  const response = await httpClient.get("/api/answer", {
    params: { photoId },
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  return response.data;
};
