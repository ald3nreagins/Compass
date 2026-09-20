import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './api';
import Login from './pages/Login';
import PortfolioOverview from './pages/PortfolioOverview';
import Analyze from './pages/Analyze';
import Portfolio from './pages/Portfolio';
import Signals from './pages/Signals';
import Candidates from './pages/Candidates';

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><PortfolioOverview /></RequireAuth>} />
        <Route path="/analyze" element={<RequireAuth><Analyze /></RequireAuth>} />
        <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
        <Route path="/signals" element={<RequireAuth><Signals /></RequireAuth>} />
        <Route path="/candidates" element={<RequireAuth><Candidates /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;