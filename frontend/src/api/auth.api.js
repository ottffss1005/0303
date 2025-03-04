import { httpClient } from "./http";

export const signup = async (userData) => {
  const response = await httpClient.post("/api/register", userData);
  return response.data;
};

export const login = async (data) => {
  const response = await httpClient.post("/api/login", data);
  return response.data;
};