import express from 'express';
import http from 'http';
import { Server } from 'socket.io';


const app = express();

const server = http.createServer(app)
const io = new Server(server)

const userSocketMap = {};

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



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});