// useAuth.js
import { useNavigate } from "react-router-dom";
import { login, signup, uploadPhoto } from "../api/auth.api";
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
    const userUploadPhoto = async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        try {
            const result = await uploadPhoto(formData);
            showAlert("사진 업로드 성공: ${result.photoUrl}");
            return result.photoUrl;
        } catch (error) {
            showAlert("사진 업로드 실패!");
            console.error(error);
            return null;
        }
    };
    return { userLogin, userSignup, userLogout, userUploadPhoto };
};