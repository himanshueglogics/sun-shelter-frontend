import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true
    });
  }
  return socket;
}

export function joinBeach(beachId) {
  const s = getSocket();
  s.emit('joinBeach', beachId);
}

export function leaveBeach(beachId) {
  const s = getSocket();
  s.emit('leaveBeach', beachId);
}

export default {
  getSocket,
  joinBeach,
  leaveBeach
};
