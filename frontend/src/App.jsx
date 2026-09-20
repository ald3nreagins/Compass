import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PortfolioOverview from './pages/PortfolioOverview';
import Analyze from './pages/Analyze';
import Portfolio from './pages/Portfolio';
import Signals from './pages/Signals';
import Candidates from './pages/Candidates';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioOverview />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/candidates" element={<Candidates />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;