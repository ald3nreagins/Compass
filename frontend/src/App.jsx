import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './api';
import { FundProvider } from './pages/FundContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PortfolioOverview from './pages/PortfolioOverview';
import Analyze from './pages/Analyze';
import Portfolio from './pages/Portfolio';
import Signals from './pages/Signals';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import Sources from './pages/Sources';

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <FundProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAuth><PortfolioOverview /></RequireAuth>} />
          <Route path="/analyze" element={<RequireAuth><Analyze /></RequireAuth>} />
          <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
          <Route path="/signals" element={<RequireAuth><Signals /></RequireAuth>} />
          <Route path="/candidates" element={<RequireAuth><Candidates /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/sources" element={<RequireAuth><Sources /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </FundProvider>
  );
}

export default App;