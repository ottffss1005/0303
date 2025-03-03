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
  const token = getToken();
  const response = await httpClient.post("/api/photos", data, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: 'Bearer ${token}',
    },
  });
  return response.data;
};
