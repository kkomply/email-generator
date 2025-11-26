import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BuilderPage from './pages/BuilderPage';
import RendererPage from './pages/RendererPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/builder" replace />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/renderer" element={<RendererPage />} />
      </Routes>
    </Router>
  );
}

export default App;
