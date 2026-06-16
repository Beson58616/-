import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/home/HomePage';
import StrategyPage from './pages/strategy/StrategyPage';
import ContentPage from './pages/content/ContentPage';
import ChannelPage from './pages/channel/ChannelPage';
import GrowthPage from './pages/growth/GrowthPage';
import ReviewPage from './pages/review/ReviewPage';
import RiskPage from './pages/risk/RiskPage';
import { Spin } from 'antd';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/strategy" element={<StrategyPage />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="/channel" element={<ChannelPage />} />
                <Route path="/growth" element={<GrowthPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/risk" element={<RiskPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
