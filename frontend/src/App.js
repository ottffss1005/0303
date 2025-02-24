import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Nav from "./components/Nav";
import Home from './pages/Home/Home';
import Main from './pages/Main/Main';
import Mypage from './pages/Mypage/Mypage';

function App() {
  return (
    <BrowserRouter>
    <Nav/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Main" element={<Main />} />
          <Route path="/Mypage" element={<Mypage/>} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
