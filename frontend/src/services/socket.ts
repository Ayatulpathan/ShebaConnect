import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
    : 'http://localhost:5000');

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const initSocket = (token: string): Socket => {
  if (socket) {
    if (socket.connected) {
      return socket;
    }
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    // console.log('Socket connected successfully');
  });

  socket.on('connect_error', () => {
    // Silently handle socket reconnects
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
