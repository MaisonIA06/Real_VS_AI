import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SecretQuizPage from './pages/SecretQuizPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMediaPairs from './pages/admin/AdminMediaPairs';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSecretQuotes from './pages/admin/AdminSecretQuotes';

function App() {
  return (
    <div className="min-h-screen bg-animated">
      <Routes>
        {/* Game routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:sessionKey" element={<GamePage />} />
        <Route path="/result/:sessionKey" element={<ResultPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/secret-quiz" element={<SecretQuizPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/pairs" element={<AdminMediaPairs />} />
        <Route path="/admin/quizzes" element={<AdminQuizzes />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/secret-quotes" element={<AdminSecretQuotes />} />
      </Routes>
    </div>
  );
}

export default App;

