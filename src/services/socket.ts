import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

export function connectSocket(token: string, force = false) {
  const baseUrl = import.meta.env.VITE_SOCKET_BASE || 'http://localhost:3001';

  if (socket && !force) {
    const tokenChanged = socketToken !== token;

    if (tokenChanged) {
      socket.disconnect();
      socket = null;
    } else {
      if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token;
  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('[socket] connected', {
      id: socket?.id,
      url: baseUrl,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', { reason });
  });

  socket.on('connect_error', (error) => {
    console.error('[socket] connect_error', error?.message || error);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
