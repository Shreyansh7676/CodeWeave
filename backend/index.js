import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
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

//uptime route
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     message: 'Your API is running',
//     timestamp: new Date().toISOString()
//   });
// });


// ─── AI Config (change these env vars to swap models) ───────────────

const AI_MODEL_URL = process.env.AI_MODEL_URL;
const AI_API_KEY   = process.env.GROQ_API_KEY;

// Detect provider from the URL
function detectProvider(url = '') {
  if (url.includes('generativelanguage.googleapis.com')) return 'gemini';
  if (url.includes('openai.com') || url.includes('openrouter.ai')) return 'openai';
  return 'openai'; // default to OpenAI-compatible format
}

// Build the request headers + body for each provider
function buildRequest(provider, apiKey, prompt) {
  if (provider === 'gemini') {
    return {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: {
        contents: [{ parts: [{ text: prompt }] }],
      },
    };
  }

  // OpenAI / OpenAI-compatible (OpenRouter, Together, etc.)
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: {
      model: process.env.AI_MODEL_NAME || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a code explainer. Explain the provided code clearly and concisely. Break down what each part does, mention the purpose, key functions, and any important patterns used. Keep it beginner-friendly but technically accurate. Use plain text formatting.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 1024,
    },
  };
}

// Extract the text from whichever response shape we get
function extractText(provider, data) {
  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  // OpenAI-compatible
  return data.choices?.[0]?.message?.content;
}

app.post('/api/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A "prompt" string is required' });
  }
  if (!AI_MODEL_URL || !AI_API_KEY) {
    return res.status(500).json({ error: 'AI_MODEL_URL or AI_API_KEY not configured on server' });
  }

  const provider = detectProvider(AI_MODEL_URL);
  const { headers, body } = buildRequest(provider, AI_API_KEY, prompt);

  try {
    const response = await fetch(AI_MODEL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('AI proxy status:', response.status);
    console.log('AI proxy response:', JSON.stringify(data, null, 2));

    const text = extractText(provider, data) || 'No explanation generated.';
    res.json({ text });
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

app.use(express.static(path.join(__dirname, '../code/dist')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, "../code/","dist","index.html")); 
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});