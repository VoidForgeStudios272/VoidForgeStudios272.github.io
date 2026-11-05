import {PlayersManager} from "../managers/players.manager.js";
import {RoomsManager} from "../managers/rooms.manager.js";

// Track socket to player mapping for cleanup on disconnect
const socketToPlayerId = {};

export const registerRoomEvents = (io, socket) => {
    /**
     * @param {{id: string, name: string, color: string}} data
     */
    const playerRegister = (data) => {
        console.log("Player register received:", data);
        PlayersManager.createPlayer(data.id, data.name, data.color);
        socket.emit('player:registered', {playerId: data.id});
    }
    const playerUnregister = (data) => {
        console.log("Player unregister received:", data);
        PlayersManager.deletePlayer(data.playerId);
        // TODO REMOVE FROM THE ROOM TOO AND SEND WIN CONDITION CHECK
        socket.emit('player:unregistered');
    }
    /**
     * @param {{hostId : string, roomId}} data
     */
    const roomCreate = (data) => {
        console.log("Room create received:", data);
        const player = PlayersManager.getPlayer(data.hostId);
        if (!player) {
            console.error("Player not found for room creation:", data.hostId);
            return;
        }
        const room = RoomsManager.createRoom(data.roomId, player);
        io.emit("room:created", {roomId: data.roomId, room: room});
        roomJoin({playerId: data.hostId, roomId: data.roomId});
    }
    /**
     * @param {{playerId : string, roomId: string}} data
     */
    const roomJoin = (data) => {
        console.log("Room join received:", data);
        if (!data?.playerId || !data?.roomId) {
            socket.emit("room:join:error", {message: "Missing playerId or roomId"});
            return;
        }

        // Track socket to player mapping for cleanup on unexpected disconnect
        socketToPlayerId[socket.id] = data.playerId;

        let player = PlayersManager.getPlayer(data.playerId);
        if (!player) {
            socket.emit("room:join:error", {message: "Player not registered. Register first."});
            console.error("Player not found for room join:", data.playerId);
            return;
        }

        if (player.roomId && player.roomId !== data.roomId) {
            roomLeave({playerId: data.playerId});
        }

        const room = RoomsManager.fetchRoom(data.roomId);
        if (!room || room.started) {
            socket.emit("room:join:error", {message: "Room not found or game already started"});
            console.error("Room not found or game already started:", data.roomId);
            return;
        }

        player = RoomsManager.players.add(data.roomId, player);
        socket.join(data.roomId);
        // TODO remove sending whole room object with imposter
        socket.emit("room:joined", {roomId: data.roomId, room, player, started: room.started});
        socket.to(data.roomId).emit("player:joined", {player, roomId: data.roomId});
    }
    const roomLeave = (data) => {
        console.log("Room leave received:", data);
        const player = PlayersManager.getPlayer(data.playerId);
        if (!player) return;

        const roomId = player.roomId;
        if (!roomId) {
            PlayersManager.resetPlayer(data.playerId);
            return;
        }

        const { deleted } = RoomsManager.players.remove(roomId, player);
        PlayersManager.resetPlayer(data.playerId);
        const win = RoomsManager.checkWin(roomId);
        console.log("Win condition check after player leave:", win);
        if (win !== null) {
            io.to(roomId).emit("game:ended", { roomId, isImposter: win });
        }
        io.to(roomId).emit("player:left", { playerId: player.id });
        PlayersManager.setRoomId(player.id, null);
        socket.leave(roomId);
        if (deleted) {
            io.emit("room:deleted", { roomId });
        }
    }
    const gameStart = (data) => {
        console.log("Game start received:", data);
        const room = RoomsManager.fetchRoom(data.roomId);
        if (!room) {
            console.error("Room not found or could not start game:", data.roomId);
            socket.emit('game:notif', {message: "Room not found"});
            return;
        }
        console.log("Room data for game start:", room);
        if (Object.values(room.players).length <= 1) {
            console.error("Not enough players in room, cannot start game:", data.roomId);
            socket.emit('game:notif', {message: "Need at least 2 players to start the game"});
            return;
        }
        RoomsManager.startGame(data.roomId);
        io.to(data.roomId).emit("game:started", data);
    }
    const sendMessage = (data) => {
        console.log("Send message received:", data);
        io.to(data.roomId).emit("room:message", {playerId: data.playerId, message: data.message});
    }
    const disconnect = (reason) => {
        console.log("Socket disconnected. Reason:", reason);
        // Handle unexpected disconnections by cleaning up the player
        const playerId = socketToPlayerId[socket.id];
        if (playerId) {
            console.log("Cleaning up disconnected player:", playerId);
            const player = PlayersManager.getPlayer(playerId);
            if (player && player.roomId) {
                const roomId = player.roomId;
                const {deleted} = RoomsManager.players.remove(roomId, player);
                socket.to(roomId).emit("player:left", {playerId: player.id});
                PlayersManager.deletePlayer(playerId);

                // Check win condition after player removal
                const win = RoomsManager.checkWin(roomId);
                if (!(win === null)) {
                    io.to(roomId).emit("game:ended", {roomId, isImposter: win});
                }

                if (deleted) {
                    io.emit("room:deleted", {roomId});
                }
            }
            delete socketToPlayerId[socket.id];
        }
    }
    const playerDisconnect = (data) => {
        console.log("Player disconnected:", data);
        const player = PlayersManager.getPlayer(data.playerId);
        if (player) {
            const roomId = player.roomId;
            const {deleted} = RoomsManager.players.remove(roomId, player);
            socket.to(roomId).emit("player:left", {playerId: player.id});
            PlayersManager.deletePlayer(data.playerId);

            // Check win condition after player removal
            const win = RoomsManager.checkWin(roomId);
            if (!(win === null)) {
                io.to(roomId).emit("game:ended", {roomId, isImposter: win});
            }

            if (deleted) {
                io.emit("room:deleted", {roomId});
            }
        }
        // Clean up socket mapping
        delete socketToPlayerId[socket.id];
    }
    socket.on("log", (data) => {
        console.log(data)
    });
    socket.on("player:register", playerRegister);
    socket.on("player:unregister", playerUnregister);
    socket.on("player:disconnect", playerDisconnect);
    socket.on("room:create", roomCreate);
    socket.on("room:join", roomJoin);
    socket.on("room:leave", roomLeave);
    socket.on("game:start", gameStart);
    socket.on("room:send:message", sendMessage);
    socket.on("disconnect", disconnect);
    // TODO cleanup old imposter sending logic
}
