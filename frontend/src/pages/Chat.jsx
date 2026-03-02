import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useEffect, useState, useRef } from "react";
import { GoArrowLeft } from "react-icons/go";
import { IoMdSend, IoMdHappy } from "react-icons/io"; 
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import EmojiPicker from 'emoji-picker-react';
import { FaRegImage } from "react-icons/fa6";
import axiosInstance from "../api/axios"; 
import { IoVideocam } from "react-icons/io5";
import { RiPhoneFill } from "react-icons/ri";

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const receiver = location.state?.receiver;
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); 
  const socket = useRef();
  const scrollRef = useRef();
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };
 
  useEffect(() => {
      socket.current = io("https://realtimecaht.onrender.com/api");

      const userId = user._id || user.id;
      socket.current.emit("addUser", userId);

      socket.current.off("getMessage").on("getMessage", (data) => {
          const currentChatPartnerId = String(receiver?._id || receiver?.id).trim();
          const incomingSenderId = String(data.senderId).trim();

          console.log("Partner ID:", currentChatPartnerId); 
          console.log("Sender ID:", incomingSenderId);

          if (incomingSenderId === currentChatPartnerId) {
              setMessages((prev) => [...prev, { 
                  sender: "other", 
                  text: data.text,
                  fileType: data.fileType, 
                  time: data.time 
              }]);
          }
      });

      socket.current.on("getCallRequest", (data) => {
          const accept = window.confirm(`${data.from} 
          You have a ${data.type} call. Do you want to join?`);
          if (accept) {
              handleCall(data.type === "Video"); 
          }
      });

      return () => {
          socket.current.disconnect();
      };
  }, [user, receiver]); 

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/upload", formData); 
      const fileData = {
        senderId: user._id || user.id,
        receiverId: receiver._id || receiver.id,
        text: res.data.url,
        fileType: res.data.type,
        time: new Date().toISOString(),
      };
      socket.current.emit("sendMessage", fileData);
      setMessages((prev) => [...prev, { ...fileData, sender: "me" }]);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && socket.current) {
      const senderId = user._id || user.id;
      const receiverId = receiver._id || receiver.id;
      const currentTime = new Date().toISOString(); 

      socket.current.emit("sendMessage", {
        senderId,
        receiverId,
        text: message,
        time: currentTime, 
      });

      setMessages((prev) => [...prev, { 
        sender: "me", 
        text: message, 
        time: currentTime 
      }]);
      setMessage("");
    }
  };

  if (!receiver) {
    navigate("/dashboard");
    return null;
  }

  const handleCall = async (isVideoCall) => {
    const appID = 852788368; 
    const serverSecret = "56f236744fb01d6c1c7188c085363ac8"; 
    
    const roomID = [user._id || user.id, receiver._id || receiver.id].sort().join("_");

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      user._id || user.id,
      user.username || "User"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: null, 
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      showPreJoinView: false, 
      turnOnCameraWhenJoining: isVideoCall,
      turnOnMicrophoneWhenJoining: true,
    });

    socket.current.emit("sendCallRequest", {
      to: receiver._id || receiver.id,
      from: user.username,
      roomID: roomID,
      type: isVideoCall ? "Video" : "Audio"
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#ECE1F4]">
      <div className="flex flex-col">
        <div className="flex justify-between items-center py-[10px] px-[20px]
        bg-[#3393D4] text-white shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/dashboard")} className="text-2xl 
            cursor-pointer p-1 hover:bg-white/20 rounded-full transition">
              <GoArrowLeft />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img className="w-11 h-11 rounded-full border-2
                border-white/50 object-cover" 
                    src={receiver.profilePic 
                    || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt="receiver" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                rounded-full border-2 border-[#3393D4]"></div>
              </div>
              <div>
                <p className="font-semibold capitalize leading-none">{receiver.username}</p>
                <span className="text-[10px]">Active Now</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center px-[20px]
        bg-[#3393D4] text-white shrink-0 pb-3 md:hidden">
          <div></div>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => handleCall(false)} 
              className="text-[23px] text-[#00f3f3] hover:scale-110 transition"
            >
              <RiPhoneFill />
            </button>

            <button 
              onClick={() => handleCall(true)} 
              className="text-[23px] text-[#00f3f3] hover:scale-110 transition"
            >
              <IoVideocam />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col 
      gap-4 md:w-[50%] m-auto w-full">
        {messages.map((msg, index) => (
          <div key={index} ref={scrollRef} className={`flex items-end 
          gap-2 ${msg.sender === "me" ? "flex-row-reverse" : "flex-row"}`}>
            <img 
              className="w-8 h-8 rounded-full object-cover"
              src={msg.sender === "me" 
                ? (user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png") 
                : (receiver.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png")} 
              alt="avatar"
            />
            
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
              msg.sender === "me" ? "bg-[#3393D4] text-white rounded-br-none" : 
              "bg-white text-gray-800 rounded-bl-none"
              }`}>
              {msg.fileType?.includes("image") ? (
                <div className="overflow-hidden rounded-lg">
                  <img 
                    src={msg.text} 
                    alt="sent" 
                    className="max-w-[180px] sm:max-w-[250px] w-full h-auto 
                    cursor-pointer object-cover hover:opacity-90 transition" 
                    onClick={() => setSelectedImg(msg.text)}
                  />
                </div>
              ) : msg.fileType?.includes("video") ? (
                <div className="overflow-hidden rounded-lg bg-black">
                  <video 
                    src={msg.text} 
                    controls 
                    className="max-w-[200px] sm:max-w-[300px] w-full h-auto shadow-md" 
                  />
                </div>
              ) : (
                <p className="break-words">{msg.text}</p>
              )}
              <p className={`text-[9px] mt-1 opacity-70 ${msg.sender === "me" ? 
                "text-right" : "text-left"}`}>
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: 
                '2-digit' })}
              </p>
            </div>

          </div>
        ))}
      </div>

      <div className="p-4 bg-white/30 backdrop-blur-sm">
        {showEmoji && (
          <div className="absolute bottom-20 left-0 right-0 m-auto z-50 flex 
          justify-center w-full px-4">
            <div className="w-full max-w-[350px]">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                autoFocusSearch={false}
                height={350}
                width="100%"
              />
            </div>
          </div>
        )}
        <div className="md:w-[50%] m-auto flex items-center  
        rounded-full px-4 border shadow-sm border-gray-500">
          
          {!message.trim() && (
            <label className="cursor-pointer text-gray-500 text-xl mr-2
            hover:text-[#3393D4] transition">
              <FaRegImage className="w-4 h-4"/>
              <input type="file" className="hidden" onChange={handleFileUpload} 
              accept="image/*,video/*" />
            </label>
          )}

          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 outline-none py-2 text-gray-700" 
            placeholder="Type a message..." 
          />

          <div className="flex items-center">
            {message.trim() ? (
              <>
                <button 
                  onClick={() => setShowEmoji(!showEmoji)} 
                  className="text-gray-500 text-2xl mr-2 
                  hover:text-[#3393D4] transition"
                >
                  <IoMdHappy />
                </button>
                <button 
                  onClick={handleSendMessage} 
                  className="text-[#3393D4] text-2xl ml-2 cursor-pointer 
                  hover:scale-110 transition"
                >
                  <IoMdSend />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowEmoji(!showEmoji)} 
                className="text-gray-500 text-2xl hover:text-[#3393D4] transition"
              >
                <IoMdHappy />
              </button>
            )}
          </div>
        </div>
      </div>
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center 
          justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImg(null)}
        >
          <button 
            className="absolute top-5 right-5 text-white text-4xl font-light
            hover:text-gray-300 transition"
            onClick={() => setSelectedImg(null)}
          >
            &times;
          </button>
          <img 
            src={selectedImg} 
            className="max-w-full max-h-full rounded-md shadow-2xl animate-in 
            zoom-in duration-300" 
            alt="Full Screen" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default Chat;