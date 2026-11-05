import { Server } from "socket.io";
import express from "express";
import apiRouter from "./routes/api.js";
import cors from "cors";
import { registerRoomEvents } from "./events/roomEvents.js";
import { registerGameEvents } from "./events/gameEvents.js";
import 'dotenv/config';
import http from "http";

const PORT = process.env.PORT || 3000;

/**
 * Parse ALLOWED_ORIGIN into a list of full origins, e.g.
 * "http://localhost:8080,https://myapp.vercel.app"
 */
function parseAllowedOrigins() {
    const raw = process.env.ALLOWED_ORIGIN || process.env.FRONTEND_URL || '';
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

const configuredOrigins = parseAllowedOrigins();

/**
 * CORS origin check. Reflects matching origins so credentials work.
 * Always allows local Vite (8080) and bare localhost/127.0.0.1 for dev.
 */
function isOriginAllowed(origin) {
    if (!origin) return true; // non-browser / same-origin tools

    if (configuredOrigins.includes('*')) return true;
    if (configuredOrigins.includes(origin)) return true;

    // Dev convenience: any localhost / 127.0.0.1 port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return true;
    }

    return false;
}

const corsOptions = {
    origin(origin, callback) {
        if (isOriginAllowed(origin)) {
            // Reflect the request origin (required when credentials: true)
            callback(null, origin || true);
        } else {
            console.warn('CORS blocked origin:', origin);
            callback(new Error(`CORS blocked for origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', apiRouter);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin(origin, callback) {
            if (isOriginAllowed(origin)) {
                callback(null, origin || true);
            } else {
                console.warn('Socket.IO CORS blocked origin:', origin);
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    registerRoomEvents(io, socket);
    registerGameEvents(io, socket);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed origins: ${configuredOrigins.length ? configuredOrigins.join(', ') : '(dev localhost defaults)'}`);
});
