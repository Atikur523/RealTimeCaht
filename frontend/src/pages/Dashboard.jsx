import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom'; 

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error("ইউজার লিস্ট লোড করতে সমস্যা হয়েছে", err);
      }
    };
    fetchUsers();
  }, []);

  const startChat = (targetUser) => {
    navigate('/chat', { state: { receiver: targetUser } });
  };

  return (
    <>
      <div className="chat-container bg-[#F0F1F6] h-screen">
        <Navbar />
        <div className="flex">
          <div className="bg-white md:w-[300px] w-full h-[calc(100vh-60px)]
           flex flex-col gap-4 overflow-y-auto">
            <h1 className="mt-5 text-center text-gray-800 text-xl font-semibold
             border-b pb-3 border-gray-300">
              Chat Members
            </h1>
            <div className="flex flex-col gap-2 p-2">
              {users.map((member) => (
                <div 
                  key={member._id} 
                  onClick={() => startChat(member)} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 
                  rounded-lg cursor-pointer transition"
                >
                  <img 
                    className="w-12 h-12 rounded-full object-cover border"
                    src={member.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt={member.username}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700 
                    capitalize">{member.username}</span>
                    <span className="text-xs text-green-500">Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:w-full w-0">
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;