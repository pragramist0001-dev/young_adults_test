import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import TestPage from './pages/TestPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import PrivateRoute from './components/PrivateRoute';
import UIGlobals from './components/UIGlobals';
import { Toaster } from 'react-hot-toast';
import Loader from './components/Loader';
import AOS from 'aos';
import 'aos/dist/aos.css';

function App() {
  const { theme } = useSelector((state) => state.ui);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-in-out',
    });
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {isLoading && <Loader />}
      <div data-theme={theme} className="min-h-screen transition-colors duration-300">
        <Toaster position="top-center" reverseOrder={false} />
        <UIGlobals />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/test/:subject" element={<TestPage />} />

            {/* Protected Routes */}
            <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
            <Route path="/teacher" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
