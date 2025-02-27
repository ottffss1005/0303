import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Nav from "./components/Nav";
import Home from "./pages/Home/Home";
import Main from "./pages/Main/Main";
import Mypage from "./pages/Mypage/Mypage";
import Settings from "./pages/Settings/Settings";
import Layout from "./layout/layout";
import Login from "./pages/Login/Login";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Main" element={<Main />} />
          <Route path="/Mypage" element={<Mypage />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Login" element={<Login />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
