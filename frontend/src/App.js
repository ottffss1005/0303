import { BrowserRouter, Routes, Route} from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Layout from "./layout/layout";
import LayoutWithoutNav from "./layout/LayoutWithoutNav";

import Nav from "./components/Nav";
import Home from "./pages/Home/Home";
import Main from "./pages/Main/Main";
import Mypage from "./pages/Mypage/Mypage";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";


function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Main" element={<Main />} />
            <Route path="/Mypage" element={<Mypage />} />
            <Route path="/Settings" element={<Settings />} />
          </Routes>
        </Layout>
      ) : (
        <LayoutWithoutNav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
          </Routes>
        </LayoutWithoutNav>
      )}
    </BrowserRouter>
  );
}

export default App;
