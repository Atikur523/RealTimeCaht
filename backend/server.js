require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 4000;

app.use(cors());  
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

const userRouter = require('./routes/authRoutes');
app.use('/api', userRouter);

app.get('/', (req, res) => {
  res.send('Chat Server is Running!');
});

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("addUser", (userId) => {
    if (userId) {
      onlineUsers = onlineUsers.filter((user) => user.userId !== userId);
      onlineUsers.push({ userId, socketId: socket.id });
    }
    console.log("Online Users:", onlineUsers);
    io.emit("getUsers", onlineUsers);
});

socket.on("sendMessage", ({ senderId, receiverId, text, fileType, time }) => {
  const receiver = onlineUsers.find((user) => String(user.userId) === String(receiverId));
  if (receiver) {
    io.to(receiver.socketId).emit("getMessage", {
      senderId, 
      text,
      fileType,
      time: time || new Date().toISOString(),
    });
  }
});

socket.on("sendCallRequest", ({ to, from, roomID, type }) => {
  const receiver = onlineUsers.find((user) => String(user.userId) === String(to));
  if (receiver) {
    io.to(receiver.socketId).emit("getCallRequest", {
      from,
      roomID,
      type
    });
  }
});

socket.on("disconnect", () => {
    console.log("User disconnected");
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", onlineUsers);
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});