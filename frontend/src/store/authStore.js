//authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";


export const getToken = () => {
  const token = localStorage.getItem("token");
  return token;
};

const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: getToken() ? true : false,
      storeLogin: (token) => {
        set(() => ({ isLoggedIn: true }));
        setToken(token);
      },
      storeLogout: () => {
        set(() => ({ isLoggedIn: false }));
        removeToken();
      },
    }),
    {
      name: "auth", // localStorage에 저장될 key
      getStorage: () => localStorage, // 기본 localStorage 사용 (세션스토리지로 변경 가능)
    }
  )
);