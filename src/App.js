import './App.css';
import './index.css';
import './home.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home';
import MainMenu from './main_menu.js';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MainMenu />} />
      </Routes>
    </Router>
  );
}

export default App;
