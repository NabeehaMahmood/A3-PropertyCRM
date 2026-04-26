import { Server as NetServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function initSocket(server: NetServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('join-admin', () => {
      socket.join('admin-room');
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitLeadCreated(lead: unknown) {
  if (io) {
    io.emit('lead:created', lead);
  }
}

export function emitLeadAssigned(lead: unknown, newAgentId: string) {
  if (io) {
    io.to(`user:${newAgentId}`).emit('lead:assigned', lead);
    io.to('admin-room').emit('lead:assigned', lead);
  }
}

export function emitLeadUpdated(lead: unknown) {
  if (io) {
    io.emit('lead:updated', lead);
  }
}