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
