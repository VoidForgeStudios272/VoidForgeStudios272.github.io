import {PlayersManager} from "./players.manager.js";

/**
 * @type {{[key: string]: import('../types/room.type.js').GameRoom}}
 */
const rooms = {"1" : {id: "1", started: false, imposter: null, host: {id: "host1", name: "Host One", roomId: "1", state: {x: 0, y: 0, d: 'left'}, color: "red", isImposter: false, isAlive: true}, players: {}, currentMeeting: null}};

export const RoomsManager = {
    players : {
            /**
             * @param {string} roomId
             * @param {import('../types/room.type.js').Player} player
             */
            add(roomId, player) {
                if (!rooms[roomId]) return;
                player = PlayersManager.setRoomId(player.id, roomId)
                rooms[roomId].players[player.id] = player;
                return player;
            },
            /**
             * @param {string} roomId
             * @param {import('../types/room.type.js').Player} player
             * @returns {{deleted: boolean}} - returns true if room was deleted due to no players
             */
            remove(roomId, player) {
                if (!rooms[roomId]) return {deleted: false};
                delete rooms[roomId].players[player.id];
                const remainingPlayers = Object.values(rooms[roomId].players);
                if (remainingPlayers.length < 1) {
                    delete rooms[roomId];
                    return {deleted: true};
                }
                if (rooms[roomId].host.id === player.id) {rooms[roomId].host = remainingPlayers[0];}
                return {deleted: false};
            },
            /**
             * @param {string} roomId
             * @param {string} playerId
             * @param {{x:number,y:number,d:string}} state
             */
            updateState(roomId, playerId, state) {
                if (!rooms[roomId] || !rooms[roomId].players[playerId]) return;
                rooms[roomId].players[playerId].state = state;
            },
    },
    meetings: {
        create(roomId, callerId, endFunc) {
          rooms[roomId].currentMeeting = {isActive: true, callerId, votes: {}, endTime: Date.now() + 10000};
          this.endTimeout = setTimeout(() => {endFunc({ roomId })}, 1000*60);
          // console.log("Meeting created in room:", roomId, rooms[roomId].currentMeeting, rooms[roomId]); // DEBUG LOG
        },
        vote(roomId, callerId, votedForId) {
            console.log("Vote received in room:", rooms[roomId], "from callerId:", callerId, "votedForId:", votedForId); // DEBUG LOG
            if (!rooms[roomId] || !rooms[roomId].currentMeeting) return null;
            rooms[roomId].currentMeeting.votes[callerId] = votedForId;
            const alivePlayers = Object.values(rooms[roomId].players).filter(p => p.isAlive);
            const votes = Object.values(rooms[roomId].currentMeeting.votes);
            console.log("Alive players for voting check:", alivePlayers, alivePlayers.length, votes.length); // DEBUG LOG
            return votes.length === alivePlayers.length;
        },
        end(roomId) {
            if (!rooms[roomId] || !rooms[roomId].currentMeeting) return null;
            const meeting = rooms[roomId].currentMeeting;
            if (!meeting.isActive) return null;

            if (this.endTimeout) {
                clearTimeout(this.endTimeout);
                this.endTimeout = null;
            }

            meeting.isActive = false;
            const votes = meeting.votes || {};

            const counts = {};
            let max = 0;
            let winners = [];
            Object.values(votes).forEach(votedForId => {
                if (votedForId == null) return;
                counts[votedForId] = (counts[votedForId] || 0) + 1;
                if (counts[votedForId] > max) {
                    max = counts[votedForId];
                    winners.splice(0, winners.length, votedForId);
                } else if (counts[votedForId] === max) {
                    winners.push(votedForId);
                }
            });

            let ejectedId = null;
            const tie = winners.length !== 1;
            if (!tie && winners.length === 1) {
                ejectedId = winners[0];
                if (rooms[roomId].players && rooms[roomId].players[ejectedId]) {
                    rooms[roomId].players[ejectedId].isAlive = false;
                }
            }

            meeting.results = { ejectedId, tie, counts, votes };
            return meeting.results;
        },
    },
    /**
     * @param {string} roomId
     * @param {import('../types/room.type.js').Player} host
     */
    createRoom(roomId, host) {
        if (rooms[roomId]) return

        rooms[roomId] = {id: roomId, started: false, imposter: null, host: host, players: {}, currentMeeting: null};
        return rooms[roomId];
    },

    fetchRooms() {
        // console.log("Fetching rooms:", rooms);
        return Object.values(rooms);
    },
    /**
     * @param {string} roomId
     */
    fetchRoom(roomId) {
        return rooms[roomId];
    },
    /**
     * @param {string} roomId
     */
    startGame(roomId) {
        if (!rooms[roomId]) return;
        rooms[roomId].started = true;
        const players = Object.values(rooms[roomId].players);

        if (!players || players.length === 0) {
            rooms[roomId].imposter = null;
            return;
        }

        // Reset alive status for all players when starting
        players.forEach(p => {
            p.isAlive = true;
            PlayersManager.updatePlayerState(p.id, {x: 560, y: 150, d: 'left', moving: false});
        });


        const idx = Math.floor(Math.random() * players.length);
        rooms[roomId].imposter = players[idx].id;
        return rooms[roomId];
        // TODO filter imposter before sending room
    },
    checkWin(roomId) {
        const room = rooms[roomId];
        console.log("Checking win for room:", roomId, room);
        if (!room || !room.started) {
            console.log("Room Not Started or not found:", roomId);
            return null;
        }

        const players = Object.values(room.players);
        const imposterId = room.imposter;
        if (!imposterId) {
            console.log("No imposter assigned in room:", roomId);
            return null;
        }

        const alivePlayers = players.filter(p => p.isAlive);
        const aliveImposters = alivePlayers.filter(p => p.id === imposterId);
        const aliveCrewmates = alivePlayers.filter(p => p.id !== imposterId);

        console.log(`Alive Imposters: ${aliveImposters.length}, Alive Crewmates: ${aliveCrewmates.length}`);

        if (aliveImposters.length >= aliveCrewmates.length && aliveCrewmates.length > 0) {
            return true;
        }

        if (aliveCrewmates.length === 0) {
            return true;
        }

        if (aliveImposters.length === 0) {
            return false;
        }

        return null;
    }
}
