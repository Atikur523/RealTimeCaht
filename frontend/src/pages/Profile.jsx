import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom"; 

const Profile = () => {
  const { user, setUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.profilePic || "");
  const navigate = useNavigate(); 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Select an image first");

    const formData = new FormData();
    formData.append("image", selectedFile); 

    try {
      const token = localStorage.getItem("token"); 

      const res = await axiosInstance.post(
        "/upload-profile-pic",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}` 
          } 
        }
      );

      const updatedUser = { ...user, profilePic: res.data.profilePic };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Image uploaded successfully");
      navigate("/dashboard");

    } catch (error) {
      console.error("Upload Error Details:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Upload failed");
    }
  };

  return (
    <>
      <div className="flex justify-center mt-[40px]">
        <div className="md:w-[400px] w-[300px] p-[30px] rounded-[10px] 
        shadow bg-white flex flex-col items-center gap-5">
          
          <div className="flex flex-col gap-2 items-center">
            <img
              className="w-24 h-24 rounded-full object-cover border border-gray-200"
              src={
                preview && preview !== "" 
                  ? preview 
                  : "/istockphoto-1495088043-612x612.png"
              }
              alt="Profile"
              onError={(e) => {
                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
              }}
            />
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="bg-blue-600 rounded cursor-pointer
            hover:bg-blue-700 transition flex items-center py-1 px-3">
              <p className="text-white text-[16px] py-2">Choose Picture</p>
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>

            <button
              onClick={handleUpload}
              className="bg-green-600 text-white py-2 px-3 rounded 
              cursor-pointer hover:bg-green-700 transition"
            >
              Upload & Start Chat
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Profile;