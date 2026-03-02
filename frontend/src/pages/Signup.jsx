import { Link } from "react-router-dom";
import { useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [fullnameError, setFullnameError] = useState("");
  const [error, setError] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let isValid = true;

    if (fullname.trim() === "") {
      setFullnameError("Fullname cannot be empty");
      isValid = false;
    } else {
      setFullnameError("");
    }

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

    if (confirmPassword.trim() === "") {
      setConfirmPasswordError("Confirm password cannot be empty");
      isValid = false;
    } 
    else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } 
    else {
      setConfirmPasswordError("");
    }

    if (!isValid) return;
    setLoading(true); 
    
    try {
      const res = await axiosInstance.post("/signup", {
        username: fullname,   
        email,
        password,
        confirmPassword,
      });

      setError("");
      alert(res.data.message);

      setUserEmail(email); 
      setShowOTPModal(true); 

      setFullname("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  const handleVerifyOTP = async (e) => {
  e.preventDefault();
    try {
      const res = await axiosInstance.post("/verify-otp", { 
        email: userEmail, 
        otp: otpInput     
      });
      alert(res.data.message);
      navigate("/login"); 
    } catch (err) { 
      alert(err.response.data.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F4] flex items-center justify-center p-4">
      <div className="bg-white flex flex-col items-center justify-center rounded-lg 
      shadow-md p-5 w-full max-w-[400px]">
        <h2 className="mb-4 text-xl font-bold">Sign Up</h2>

        <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="fullname">Fullname</label>
            <input
              value={fullname}
              onChange={(e) => {
                setFullname(e.target.value);
                if (e.target.value.trim() !== "") setFullnameError("");
              }}
              className="py-2 outline-none border-[1px] border-gray-200 pl-2 
              rounded w-full focus:ring-1 focus:ring-blue-400"
              placeholder="fullname"
              type="text"
              required
            />
            {fullnameError && (
              <p className="text-red-500 text-sm mt-1">{fullnameError}</p>
            )}
          </div>

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
            <div className="py-2 border-[1px] border-gray-200 rounded w-full 
            flex justify-between items-center">
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

          <div className="flex flex-col gap-1">
            <label>Confirm Password</label>
            <div className="py-2 border-[1px] border-gray-200 rounded w-full 
            flex justify-between items-center">
              <input
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value.trim() !== "") setConfirmPasswordError("");
                }}
                className="pl-2 border-none outline-none bg-transparent w-[90%]"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm Password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="cursor-pointer mr-2"> {showConfirmPassword ? "👁" : "👁‍🗨"} </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
            )}
          </div>

          <button className="mt-4 bg-blue-500 text-white py-2 w-full 
          rounded hover:bg-blue-600 cursor-pointer">
            Sign Up
          </button>
        </form>

        <div className="flex justify-end w-full mt-4 text-sm">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
        justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-[350px]">
            <h3 className="text-lg font-bold mb-4">Verify Your Email</h3>
            <p className="text-sm text-gray-600 mb-4">
            Enter the 6-digit code sent to {userEmail}</p>
            
            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-2 border rounded mb-4 text-center 
                text-xl tracking-widest"
                maxLength="6"
                required
              />
              <button className="w-full bg-green-500 text-white py-2 
              rounded hover:bg-green-600">
                Verify OTP
              </button>
            </form>
            
            <button 
              onClick={() => setShowOTPModal(false)}
              className="w-full mt-2 text-gray-500 text-sm hover:underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;