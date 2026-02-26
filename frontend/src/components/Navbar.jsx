import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center 
    py-[10px] px-[20px] bg-[#3393D4] text-white">
      <div>
        <h1 className="text-white decoration-none font-bold">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Link to="/profile" title="Go to Profile">
            <img 
              src={user?.profilePic || "/istockphoto-1495088043-612x612.png"} 
              alt="profile" 
              className="w-10 h-10 rounded-full object-cover border-2 
              border-transparent hover:border-blue-500 transition cursor-pointer"
              onError={(e) => {
                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          </Link>
        </div>
        
        <button 
          className="py-[5px] px-[10px] bg-[#ff0080] border-none 
          cursor-pointer rounded hover:bg-[#f50a7f] transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;