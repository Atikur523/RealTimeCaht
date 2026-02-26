import { Routes, Route, Navigate } from "react-router-dom";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !user ? <Navigate to="/login" /> : (user.profilePic ? 
          <Navigate to="/dashboard" /> : <Navigate to="/profile" />)
        } 
      />
      <Route 
        path="/login" 
        element={!user ? <Login /> : (user.profilePic ? 
        <Navigate to="/dashboard" /> : <Navigate to="/profile" />)} 
      />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
      <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute> <Chat /> </ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;