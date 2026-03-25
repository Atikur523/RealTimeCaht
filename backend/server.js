require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "https://real-time-caht.vercel.app" 
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ DB Connection Error:', err));

const userRouter = require('./routes/authRoutes');
app.use('/api', userRouter);

app.get('/', (req, res) => res.send('Chat Server is Running!'));

let onlineUsers = [];

io.on("connection", (socket) => {
    socket.on("sendCallRequest", (data) => {
        const receiver = onlineUsers.find((u) => String(u.userId) === String(data.to));
        if (receiver) {
            io.to(receiver.socketId).emit("getCallRequest", {
                from: data.from,
                fromId: data.fromId,
                type: data.type,
                roomID: data.roomID
            });
        }
    });

    socket.on("addUser", (userId) => {
        if (userId) {
            onlineUsers = onlineUsers.filter((u) => u.userId !== userId);
            onlineUsers.push({ userId, socketId: socket.id });
        }
        io.emit("getUsers", onlineUsers);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, text, fileType, time }) => {
        try {
            const newMessage = new Message({
                sender: senderId,
                receiver: receiverId,
                text: text,
                fileType: fileType, 
                time: time
            });
            await newMessage.save();

            const receiver = onlineUsers.find((u) => String(u.userId) === String(receiverId));
            if (receiver) {
                io.to(receiver.socketId).emit("getMessage", {
                    senderId,
                    senderName: "User", 
                    text,
                    fileType, 
                    time
                });
            }
        } catch (error) {
            console.error("Message error:", error);
        }
    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
        io.emit("getUsers", onlineUsers);
    });

    socket.on("deleteMessage", ({ messageId, receiverId }) => {
        const receiver = onlineUsers.find((u) => String(u.userId) === String(receiverId));
        if (receiver) {
            io.to(receiver.socketId).emit("messageDeleted", messageId);
        }
    });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`🚀 Server on port ${port}`));
