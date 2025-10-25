import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./components/LandingPage.jsx";
import ChartView from "./components/ChartView.jsx";
import AuthPage from "./components/AuthPage.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/chart" /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/chart" /> : <AuthPage />} />

        {/* Protected routes */}
        <Route
          path="/chart"
          element={
            <ProtectedRoute>
              <Navbar />
              <ChartView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
