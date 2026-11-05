import { io } from "socket.io-client";
import { getSocketUrl } from '../utils/urls.js';

// undefined → connect to page origin (Vite proxies /socket.io in dev)
const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    // Prefer websocket; fall back to polling if needed
    transports: ['websocket', 'polling'],
});

socket.on("connect", () => {
    console.log("Connected to server with id:", socket.id, "url:", SOCKET_URL ?? window.location.origin);
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected from server. Reason:", reason);
    // Socket is already disconnected here — cannot emit reliably.
    // Cleanup is handled by the backend 'disconnect' handler via socketToPlayerId.
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message || error);
});

export const socketService = {
    connect: () => {
        if (!socket.connected) {
            socket.connect();
        }
    },

    disconnect: (playerId) => {
        if (socket.connected) {
            const id = playerId || sessionStorage.getItem("playerId");
            if (id) {
                socket.emit("player:disconnect", { playerId: id });
                console.log("Emitted player:disconnect for:", id);
            }
            // Brief delay so the disconnect event is flushed before close
            setTimeout(() => {
                socket.disconnect();
            }, 100);
        } else {
            socket.disconnect();
        }
    },

    getSocket: () => socket,
};

export default socketService;
