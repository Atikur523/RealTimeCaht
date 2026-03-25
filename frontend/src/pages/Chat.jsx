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
import Notification from "../components/Notification";

const speakNotification = (receiverName, senderName, type = "message") => {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    const audioUrl =
      type === "message"
        ? "https://res.cloudinary.com/db7793j7u/video/upload/v1692182000/notification_sound.mp3"
        : "https://www.soundjay.com/buttons/beep-01a.mp3";

    const audio = new Audio(audioUrl);
    audio.play().catch((err) => {
      console.log("Mobile sound blocked:", err);
    });
    return;
  }

  const synth = window.speechSynthesis;

  let text = "";
  if (type === "message") {
    text = `হ্যালো ${receiverName}, আপনাকে রিয়েল টাইম চ্যাট এপ্লিকেশন থেকে ${senderName} মেসেজ পাঠাচ্ছে।`;
  } else {
    text = `হ্যালো ${receiverName}, আপনাকে রিয়েল টাইম চ্যাট এপ্লিকেশন থেকে ${senderName} একটি ${type} কল দিচ্ছে।`;
  }

  const utterThis = new SpeechSynthesisUtterance(text);
  utterThis.lang = "bn-BD";
  utterThis.rate = 1.0;

  utterThis.onend = () => {
    const audioUrl =
      type === "message"
        ? "https://res.cloudinary.com/db7793j7u/video/upload/v1692182000/notification_sound.mp3"
        : "https://www.soundjay.com/buttons/beep-01a.mp3";

    const audio = new Audio(audioUrl);
    audio.play().catch(() => {});
  };

  synth.speak(utterThis);
};

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
  const [notifications, setNotifications] = useState([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };
 
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio();
      audio.play().catch(() => {});
      setAudioUnlocked(true);
      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
  }, []);

  const showNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userId = user._id || user.id;
        const receiverId = receiver._id || receiver.id;
        const res = await axiosInstance.get(`/messages/${userId}/${receiverId}`);
        
        const formattedMsgs = res.data.map(msg => ({
          _id: msg._id, 
          sender: msg.sender === userId ? "me" : "other",
          text: msg.text,
          time: msg.createdAt,
          fileType: msg.fileType 
        }));
        setMessages(formattedMsgs);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    if (receiver) fetchMessages();
  }, [receiver, user]);

  useEffect(() => {
    socket.current = io("https://realtimecaht.onrender.com"); 

    const userId = user._id || user.id;
    socket.current.emit("addUser", userId);

    socket.current.on("getMessage", (data) => {
      const currentChatPartnerId = String(receiver?._id || receiver?.id).trim();
      const senderIdFromSocket = String(data.senderId).trim();

      const isTabActive = document.visibilityState === "visible";
      const isSameChat = senderIdFromSocket === currentChatPartnerId;

      if (!isTabActive) {
        speakNotification(user.username, receiver?.username || "User", "message");
      }

      if (isTabActive && !isSameChat) {
        showNotification(`📩 New message`);
      }

      if (isSameChat) {
          setMessages((prev) => [...prev, { 
              _id: data._id || Date.now().toString(), 
              sender: "other", 
              text: data.text,
              fileType: data.fileType, 
              time: data.time || new Date().toISOString()
          }]);
      }
    });

    socket.current.on("messageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socket.current.on("getCallRequest", (data) => {
      const currentChatPartnerId = String(receiver?._id || receiver?.id).trim();
      
      if (document.visibilityState !== 'visible' || String(data.fromId) !== currentChatPartnerId) {
          speakNotification(user.username, data.from, data.type === "Video" ? "ভিডিও" : "অডিও");
      }
      
      const accept = window.confirm(`${data.from} থেকে কল আসছে। জয়েন করবেন?`);
      if (accept) handleCall(data.type === "Video"); 
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

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
        try {
            await axiosInstance.delete(`/messages/${messageId}`);
            
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

            socket.current.emit("deleteMessage", { 
                messageId, 
                receiverId: receiver._id || receiver.id 
            });
        } catch (err) {
            console.error("Delete failed", err);
        }
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
      fromId: user._id || user.id,
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
          <div key={index} ref={scrollRef} className={`flex items-end group 
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

            {msg.sender === "me" && (
                <button 
                    onClick={() => handleDeleteMessage(msg._id)}
                    className="text-red-500 hover:text-red-700 text-[10px] ml-2 
                    opacity-100 md:opacity-0 md:group-hover:opacity-100 
                    transition-opacity duration-200 p-1"
                >
                    Delete
                </button>
            )}
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

      {notifications.map((n) => (
        <Notification 
          key={n.id} 
          message={n.text} 
          onClose={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
        />
      ))}
    </div>
  );
};
export default Chat;