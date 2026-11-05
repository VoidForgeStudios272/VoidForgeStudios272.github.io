import express from "express";
import { RoomsManager } from "../managers/rooms.manager.js";
import { PlayersManager } from "../managers/players.manager.js";

const router = express.Router();

router.get("/status", (req, res) => {
    res.send("OK");
});

router.get("/rooms", (req, res) => {
    res.json(RoomsManager.fetchRooms());
});

router.get("/player/room/:playerId", (req, res) => {
    const playerId = req.params.playerId;
    const player = PlayersManager.getPlayer(playerId);
    if (!player) {
        console.log("Player not found:", playerId);
        res.status(404).json({ error: "Player not found" });
        return;
    }
    const room = RoomsManager.fetchRoom(player.roomId);
    if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
    }
    res.json({ room, player });
});

router.get("/isImposter/", (req, res) => {
    const playerId = req.query.playerId;
    const roomId = req.query.roomId;
    const room = RoomsManager.fetchRoom(roomId);
    if (!room) {
        console.log("Room not found for isImposter check:", roomId);
        res.status(404).json({ error: "Room not found" });
        return;
    }
    if (!room.imposter) {
        console.error("No imposter assigned in room:", roomId);
        res.status(400).json({ error: "No imposter assigned in room" });
        return;
    }
    const isImposter = room.imposter === playerId;
    console.log("Checking if player is imposter:", playerId, room.imposter, isImposter);
    res.json({ isImposter });
});

router.get("/rooms/:roomId", (req, res) => {
    const room = RoomsManager.fetchRoom(req.params.roomId);
    if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
    }
    res.json(room);
});

export default router;
