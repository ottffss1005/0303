import axios from 'axios';

import { getToken, removeToken } from '../store/authStore';

const BASE_URL = "http://localhost:5000/"
const DEFAULT_TIMEOUT = 30000;

export const createClient = (config) => {
    const axiosInstance = axios.create({
        baseURL: BASE_URL,
        timeout: DEFAULT_TIMEOUT,
        headers: {
            "content-type": "application/json",
            Authorization: getToken() ? getToken() : "",
        },
        withCredentials: true,
        ...config,
    });

    axiosInstance.interceptors.response.use((response) => {
        return response;
    },
        (error) => {
            // 로그인 완료 처리
            if (error.response.status === 401) {
                removeToken();
                window.location.href = "/api/login";
                return;
            }
            return Promise.reject(error);
        }
    )

    return axiosInstance;
}

export const httpClient = createClient();

export const requestHandler = async(
    method,
    url,
    payload
) => {
    let response;
    switch (method) {
        case "post":
            response = await httpClient.post(url, payload);
            break;
        case "get":
            response = await httpClient.get(url);
            break;
        case "put":
            response = await httpClient.put(url, payload);
            break;
        case "delete":
            response = await httpClient.delete(url);
            break;
        default:
            throw new Error(`지원하지 않는 메소드: ${method}`)
    }

    return response.data;
};