import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
// import {connectDB} from './config.js'

const app = express();

// Add CORS middleware
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://codeweave-7yxf.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Add JSON parsing middleware
app.use(express.json());

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://codeweave-7yxf.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
})
const __dirname=path.resolve() 
const userSocketMap = {};

// Use MongoDB Atlas for production or environment variable for local development
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codeweave";

mongoose.connect(mongoURI)
.then(() => console.log("✅ DB connected to:", mongoURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'))
.catch(err => console.error("❌ MongoDB connection error:", err));


const codeSchema=new mongoose.Schema({
  roomId:{
    type:String,
    required:true,
    unique:true
  },
  code:{
    type:String,
    default:''
  },
  lastUpdates:{
    type:Date,
    default:Date.now
  }
});

const codeModel=mongoose.model('Code',codeSchema);

const getAllConnectedClients = (id) => {
  return Array.from(io.sockets.adapter.rooms.get(id) || []).map(
    (socketId) => {
      return {
        socketId,
        userName: userSocketMap[socketId]
      }
    }
  );
}


io.on('connection', (socket) => {
  console.log(`A user connected with id: ${socket.id}`);

  socket.on('join', ({ id, userName }) => {
    userSocketMap[socket.id] = userName;
    socket.join(id);
    const clients = getAllConnectedClients(id);

    //notifying all clients in the room
    clients.forEach(({ socketId }) => {
      if (socketId !== socket.id) {
        io.to(socketId).emit('joined', { clients, userName, socketId: socket.id });
      }
    });
    socket.emit('joined', { clients, userName, socketId: socket.id });
  });

  socket.on('code-change',({id,code})=>{
    socket.in(id).emit('code-change',{code});
  });

  socket.on('sync-code',({socketId, code}) => {
    io.to(socketId).emit('code-change',{code});
  })

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((id) => {
      socket.in(id).emit('disconnected', {
        socketId: socket.id,
        userName: userSocketMap[socket.id]
      });
      delete userSocketMap[socket.id];
      socket.leave();
    })
  })
});

// API Routes - Define these BEFORE static file serving
app.get('/api/room/:roomId',async(req,res)=>{
  const {roomId} = req.params;
  try {
    let room = await codeModel.findOne({roomId});
    
    if(!room){
      room = await codeModel.create({roomId});
    }
    res.status(200).json({ code: room.code });
  } catch (error) {
    console.error('Error fetching room:', error);
    return res.status(500).json({error: 'Failed to fetch room data'});
  }
})

app.post('/api/room/:roomId/save',async(req,res)=>{
  const {roomId} = req.params;
  const { code } = req.body;
  
  console.log('Save request received:', { 
    roomId, 
    codeLength: code?.length,
    mongoURI: process.env.MONGODB_URI ? 'Using Atlas' : 'Using Local',
    headers: req.headers.origin
  });
  
  if(code === null || code === undefined){
    return res.status(400).json({error:"Code is required"});
  }
  try {
    
    const room = await codeModel.findOneAndUpdate(
      { roomId },
      { code, lastUpdates : Date.now() },
      { 
        new: true, 
        upsert: true // Create if doesn't exist
      }
    );
    
    console.log('Code saved successfully for room:', roomId);
    
    res.status(200).json({ 
      message: "Code saved successfully",
      room
    });
  } catch (error) {
    console.error('Error saving code:', error);
    return res.status(500).json({error: 'Failed to save code'});
  }
})

// Static file serving - This should come AFTER API routes
app.use(express.static(path.join(__dirname, '../code/dist')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, "../code/","dist","index.html")); 
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});