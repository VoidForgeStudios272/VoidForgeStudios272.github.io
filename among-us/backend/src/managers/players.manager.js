/**
 * @type {{[key: string] : import('../types/room.type.js').Player}}
 */
const players = {};

export const PlayersManager = {

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} color
     * @param {string|null} roomId
     */
    createPlayer(id, name, color, roomId= null) {
        const key = id;
        if (!players[key]) {
            players[key] = {
                id: key,
                name: name,
                roomId: roomId,
                state: {x: 560, y: 150, d: 'left', moving: false},
                color: color,
                isImposter: false,
                isAlive: true,
            };
        } else {
            // Update existing player's name and color
            players[key].name = name;
            players[key].color = color;
        }
    },

    /**
     * @param {string} id
     * */
    deletePlayer(id) {
        delete players[id];
    },

    /**
     * @param {string} id
     * @param {{x: number, y: number, d: string}} state
     */
    updatePlayerState(id, state) {
        if (players[id]) {
            players[id].state = {...players[id].state, ...state};
        }
    },

    /**
     * @param {string} id
     */
    getPlayer(id) {
        return players[id];
    },

    getAllPlayers() {
        return Object.values(players);
    },
    resetPlayer(id) {
        if (players[id]) {
            players[id].state = {x: 560, y: 150, d: 'left', moving: false};
            players[id].isAlive = true;
            players[id].isImposter = false;
        }
    },
    setRoomId(id, roomId) {
        if (players[id]) {
            players[id].roomId = roomId;
            return players[id];
        }

    },
}
