import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import LandingPage from "./components/pages/LandingPage.jsx";
import ChartView from "./components/pages/ChartView.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/chart" /> : <LandingPage />} />

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
