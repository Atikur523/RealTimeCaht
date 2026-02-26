import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); 
    navigate("/login"); 
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const validateUser = async () => {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          logout();
          return;
        }

        const res = await axiosInstance.get("/profile");

        if (!res.data.user) {
          logout();
          return;
        }

        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));

      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);