import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./components/pages/LandingPage.jsx";
import ChartPage from "./components/pages/ChartPage.jsx";
import { authClient } from "../lib/auth-client";

function App() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/chart" /> : <LandingPage />}
        />
        <Route
          path="/chart"
          element={user ? <ChartPage /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
