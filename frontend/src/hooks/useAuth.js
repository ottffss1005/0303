// useAuth.js
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api/auth.api";
import { useAlert } from "./useAlert";
import { useAuthStore } from "../store/authStore";


export const useAuth = () => {
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const { storeLogin, storeLogout } = useAuthStore();

    const userLogin = (data) => {
        login(data).then(
            (res) => {
                // 상태 업데이트
                storeLogin(res.token);
                showAlert("로그인이 완료되었습니다.");
                navigate("/Main");
            },
            (error) => {
                showAlert("로그인이 실패했습니다.");
            }
        );
    };
    const userSignup = (data) => {
        signup(data).then((res) => {
            // 성공
            showAlert("회원가입이 완료되었습니다.");
            navigate("/Login");
        });
    };
    const userLogout = () => {
        storeLogout();
        showAlert("로그아웃이 완료되었습니다.");
        navigate("/");
    };

    return { userLogin, userSignup, userLogout };
};