import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;

    if (email.trim() === "") {
      setEmailError("Email cannot be empty");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (password.trim() === "") {
      setPasswordError("Password cannot be empty");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isValid) return;

    try {
      const res = await axiosInstance.post("/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user); 
      alert(res.data.message);

      if (res.data.user.profilePic) {
          navigate("/dashboard");
      } else {
          navigate("/profile");
      }

      if (res.data.user.profilePic) {
        navigate("/dashboard");
      } 
      else { 
        navigate("/profile");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F4] flex items-center justify-center p-4">
      <div className="bg-white flex flex-col items-center justify-center 
      rounded-lg shadow-md p-5 w-full max-w-[400px]">
        <h2 className="mb-4 text-xl font-bold">Log In</h2>

        <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>

          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value.trim() !== "") setEmailError("");
              }}
              className="py-2 outline-none border-[1px] border-gray-200 pl-2 
              rounded w-full focus:ring-1 focus:ring-blue-400"
              type="email"
              required
              placeholder="Email"
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label>Password</label>
            <div className="py-2 border-[1px] border-gray-200 flex justify-between 
            items-center rounded w-full">
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.trim() !== "") setPasswordError("");
                }}
                className="pl-2 border-none outline-none bg-transparent w-[90%]"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} 
              className="cursor-pointer mr-2"> {showPassword ? "👁" : "👁‍🗨"} </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button className="mt-4 bg-blue-500 text-white py-2 w-full 
          rounded hover:bg-blue-600 cursor-pointer">
            Log In
          </button>
        </form>

        <div className="flex justify-end w-full mt-4 text-sm">
          <p>
            Don’t have account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;