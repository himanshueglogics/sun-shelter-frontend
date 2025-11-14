import { io } from 'socket.io-client';

let socket;

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
// const SOCKET_URL='https://wagonless-byron-noninclusively.ngrok-free.dev' || "http://localhost:5000";

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
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
