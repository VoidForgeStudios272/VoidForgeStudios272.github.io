import {BaseGameScene} from './BaseGameScene.js';
import {socketService} from '../../services/socket.js';
import { apiUrl } from '../../utils/urls.js';
import {EventBus} from '../EventBus.js';

/**
 * Waiting lobby scene - extends BaseGameScene with lobby-specific map and rules
 */
export class WaitingLobby extends BaseGameScene {
    constructor() {
        super('WaitingLobby');
        // No idea how this fixed it
        this.handleStartGame = this.handleStartGame.bind(this);
    }
    init(data) {
        console.log("Lobby Scene started with ", data)
    }
    /**
     * Handle start game event from React
     */
    handleStartGame(data) {
        console.log('handleStartGame called with data:', data, this.scene);
        if (this.scene && this.scene.isActive('WaitingLobby')) {
            console.log('Starting game with data:', data);
            // TODO fetch only when sure that imposter is set
            data.isImposter = fetch(apiUrl(`/isImposter/?roomId=${data.roomId}&playerId=${data.playerId}`))
                .then(res => res.json())
                .then(json => json.isImposter)
                .catch(err => {
                    console.error('Error checking imposter status:', err);
                    return false;
                });
            this.scene.start('Game', data);
        }
    }
    /**
     * Lobby-specific map configuration
     */
    getMapConfig() {
        return {
            mapKey: 'lobbyMapJSON',
            mapJSON: 'lobby.json',
            tilesetName: 'red',
            tilesetKey: 'red',
            backgroundKey: 'lobby',
            backgroundImage: 'Lobby.png'
        };
    }
    preload() {
        this.preloadCommon();
        this.preloadMap();
    }
    create() {
        this.createCommon();

        // Remove existing listeners first to avoid duplicates
        EventBus.removeAllListeners('start-game');
        // Listen for game start event from React
        EventBus.on('start-game', this.handleStartGame, this);


    }
    update(time, delta) {
        this.handleMovement();
    }
    shutdown() {
        super.shutdown();
        EventBus.off('start-game', this.handleStartGame, this);
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('game:start');
        }
    }
}
