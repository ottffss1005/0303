// useAuth.js
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";
import { useAlert } from "./useAlert";
import { useAuthStore } from "../store/authStore";
import { signup } from "../api/auth.api";

export const useAuth = () => {
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const { storeLogin } = useAuthStore();

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

    return { userLogin, userSignup };
};