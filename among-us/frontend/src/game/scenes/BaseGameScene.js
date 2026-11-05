import { Scene } from 'phaser';
import { socketService } from '../../services/socket.js';
import { apiUrl } from '../../utils/urls.js';
import { EventBus } from '../EventBus';
import { createPlayer } from '../utils/playerFactory.js';

/**
 * Base class for shared logic of player management, movement, and socket events
 */
export class BaseGameScene extends Scene {
    constructor(key) {
        super(key);
    }

    init(data) {
        this.config = data;
        this.roomId = data?.roomId || null;
    }

    /**
     * Override in child classes, will provide scene specific map configuration
     * @returns {{ mapKey: string, mapJSON: string, tilesetName: string, tilesetKey: string, backgroundKey: string, backgroundImage: string }}
     */
    getMapConfig() {
        throw new Error('getMapConfig() must be implemented by child class');
    }

    /**
     * Common assets
     */
    preloadCommon() {
        this.load.atlas(
            'player',
            'assets/walk/texture.png',
            'assets/walk/texture.json'
        );
        this.load.image('idleImage', 'assets/sprites/Base/idle.png');
    }

    /**
     * Load map specific assets based on getMapConfig()
     */
    preloadMap() {
        const config = this.getMapConfig();
        // TODO make it more dynamic to handle multiple tilesets
        this.load.image(config.tilesetKey, `assets/map/${config.tilesetKey}.png`);
        this.load.image(config.backgroundKey, `assets/map/${config.backgroundImage}`);
        this.load.tilemapTiledJSON(config.mapKey, `assets/map/${config.mapJSON}`);
    }

    createWalkAnimation() {
        if (this.anims.exists('walk')) return;

        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'player', frame: 'Walk0001.png' },
                { key: 'player', frame: 'Walk0002.png' },
                { key: 'player', frame: 'Walk0003.png' },
                { key: 'player', frame: 'Walk0004.png' },
                { key: 'player', frame: 'Walk0005.png' },
                { key: 'player', frame: 'Walk0006.png' },
                { key: 'player', frame: 'Walk0007.png' },
                { key: 'player', frame: 'Walk0008.png' },
                { key: 'player', frame: 'Walk0009.png' },
                { key: 'player', frame: 'Walk0010.png' },
                { key: 'player', frame: 'Walk0011.png' },
                { key: 'player', frame: 'Walk0012.png' }
            ],
            frameRate: 12,
            repeat: -1
        });
    }

    /**
     * Setup tilemap and collision layer
     */
    setupMap() {
        const config = this.getMapConfig();

        const map = this.make.tilemap({ key: config.mapKey });
        const tileset = map.addTilesetImage(config.tilesetName, config.tilesetKey);
        const collisionLayer = map.createLayer('collisions', tileset, 0, 0);


        this.background = this.add.image(0, 0, config.backgroundKey).setOrigin(0, 0).setName('background');
        this.worldContainer.add(this.background);

        if (collisionLayer) {
            if (this.scene.key === 'WaitingLobby') {
                const scaleX = 1232 / (map.widthInPixels);
                const scaleY = 1008 / (map.heightInPixels);
                collisionLayer.setScale(scaleX, scaleY);
            }

            collisionLayer.setVisible(false);
            collisionLayer.setCollisionByExclusion([-1, 0]);
            this.collisionLayer = collisionLayer;
            this.worldContainer.add(collisionLayer);

            if (this.physics.config.debug) {
                collisionLayer.setVisible(true);
                collisionLayer.setAlpha(0.5);
                const debugGraphics = this.add.graphics().setAlpha(0.7);
                collisionLayer.renderDebug(debugGraphics, {
                    tileColor: null,
                    collidingTileColor: new Phaser.Display.Color(255, 0, 0, 128),
                    faceColor: new Phaser.Display.Color(0, 255, 0, 255)
                });
            }
        }

        return { map, tileset, collisionLayer };
    }

    /**
     * Setup keyboard inputs for movement
     */
    setupInput() {
        // TODO review input handling
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    /**
     * Add a player sprite to the scene
     * @param {{ id: string, x: number, y: number, color: string }} playerData
     */
    addPlayer(playerData) {
        const newPlayer = createPlayer(this, playerData, {
            addCollision: true,
            collisionLayer: this.collisionLayer
        });
        newPlayer.id = playerData.id;
        newPlayer.alive = true;

        // Scale up sprites for lobby scene to match smaller map size
        if (this.scene.key === 'WaitingLobby') {
            newPlayer.setScale(0.3);
        }

        this.players[playerData.id] = newPlayer;

        // Save spawn position
        if (!this.spawnPositions[playerData.id]) {
            this.spawnPositions[playerData.id] = { x: playerData.x, y: playerData.y };
        }

        return newPlayer;
    }

    /**
     * Remove a player sprite from the scene
     * @param {string} playerId
     */
    removePlayer(playerId) {
        if (!this.players[playerId]) return;
        if (this.sys && this.sys.displayList) {
            this.players[playerId].destroy();
        }
        delete this.players[playerId];
        console.log("Players Modified", this.players);
    }

    /**
     * Fetch room data and setup players
     */
    async fetchAndSetupPlayers() {
        const playerId = sessionStorage.getItem("playerId");
        const socket = socketService.getSocket();

        console.log("Fetching room data for playerId:", playerId, "socket id:", socket?.id);

        const response = await fetch(apiUrl(`/player/room/${playerId}`));
        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            console.error("Failed to fetch player room:", response.status, errBody);
            return;
        }
        const data = await response.json();

        console.log("room joined data:", data);

        if (!this.sys || !this.sys.displayList) return;
        if (!data?.room || !data?.player) {
            console.error("Invalid room payload:", data);
            return;
        }

        this.room = data.room;
        this.player = this.addPlayer({
            id: data.player.id,
            x: data.player.state.x,
            y: data.player.state.y,
            color: data.player.color
        });
        this.playerObj = data.player;
        console.log("Created own player sprite:", this.player, this.players);

        // Set camera zoom based on scene type
        const zoom = this.scene.key === 'WaitingLobby' ? 1 : 3;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.ignore(this.ui);

        // Add existing players in the room
        Object.values(this.room.players).forEach((player) => {
            if (player.id === this.playerObj.id) return;
            console.log("Adding existing player:", player);
            this.addPlayer({
                id: player.id,
                x: player.state.x,
                y: player.state.y,
                color: player.color
            });
        });
    }

    /**
     * Setup socket event listeners for player events
     */
    setupSocketListeners() {
        const socket = socketService.getSocket();
        if (!socket) return;

        // Prevent registering the same handlers multiple times
        if (this._socketListenersAdded) {
            this.socket = socket;
            return;
        }

        this.socket = socket;

        // named handlers so they can be removed later
        this._onPlayerJoined = (data) => {
            console.log("player joined", data);
            if (!this.sys || !this.sys.displayList) return;
            this.addPlayer({
                id: data.player.id,
                x: data.player.state.x,
                y: data.player.state.y,
                color: data.player.color
            });
        };

        this._onPlayerLeft = (data) => {
            console.log("player left", data);
            this.removePlayer(data.playerId);
        };

        this._onPlayerMoved = (data) => {
            const player = this.players[data.id];
            if (!player || !player.alive) return;

            if (data.id !== this.playerObj?.id) {
                player.x = data.x;
                player.y = data.y;
            }

            if (data.d) player.flipX = data.d === 'left';

            if (!player.anims) return;
            if (data.moving) {
                if (!player.anims.isPlaying) player.anims.play('walk');
            } else {
                player.anims.stop();
                player.setTexture('idleImage');
            }
        };

        socket.on('player:joined', this._onPlayerJoined);
        socket.on('player:left', this._onPlayerLeft);
        socket.on('player:moved', this._onPlayerMoved);

        this._socketListenersAdded = true;
    }

    /**
     * Cleanup socket listeners
     */
    cleanupSocketListeners() {
        if (this.socket && this._socketListenersAdded) {
            // Remove only the handlers we added
            if (this._onPlayerJoined) this.socket.off('player:joined', this._onPlayerJoined);
            if (this._onPlayerLeft) this.socket.off('player:left', this._onPlayerLeft);
            if (this._onPlayerMoved) this.socket.off('player:moved', this._onPlayerMoved);

            // clear refs
            this._onPlayerJoined = null;
            this._onPlayerLeft = null;
            this._onPlayerMoved = null;
            this._socketListenersAdded = false;
        }
    }

    /**
     * Common create logic for all game scenes
     */
    async createCommon() {
        this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.worldContainer = this.add.container(0, 0).setDepth(0);
        this.players = {};
        this.spawnPositions = {};
        // Track spawn positions for each player
        const uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        uiCam.setScroll(0, 0);
        uiCam.setZoom(1);
        uiCam.ignore(this.worldContainer);

        this.cameras.main.ignore(this.ui);

        this.createWalkAnimation();
        this.setupMap();
        this.setupInput();
        this.setupSocketListeners();
        await this.fetchAndSetupPlayers();
        console.log("Finished Setting Up Players: ", this.player);
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Handle player movement (call in update)
     */
    handleMovement() {
        if (!this.player || !this.player.body) return;

        // Disable movement during meeting
        if (this.meetingActive) {
            this.player.body.setVelocity(0, 0);
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
                this.player.setTexture('idleImage');
            }
            return;
        }

        // Reset velocity each frame
        this.player.body.setVelocity(0, 0);

        const speed = this.scene.key === 'WaitingLobby' ? 350 : 100;
        let vx = 0;
        let vy = 0;

        if (this.wKey.isDown) { vy = -speed; }
        if (this.sKey.isDown) { vy = speed; }
        if (this.aKey.isDown) { vx = -speed; this.playerObj.state.d = 'left'; }
        if (this.dKey.isDown) { vx = speed; this.playerObj.state.d = 'right'; }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Local Player Movement
        if (this.player.alive) {
            this.player.body.setVelocity(vx, vy);
            if (vx < 0) this.player.flipX = true;
            else if (vx > 0) this.player.flipX = false;
        }


        const isMoving = vx !== 0 || vy !== 0;
        if (isMoving) {
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('walk');
            }
        } else {
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
                this.player.setTexture('idleImage');
            }
        }

        // Send movement to server
        if (isMoving || this.wasMoving) {
            this.time.delayedCall(0, () => {
                if (!this.player || !this.socket) return;
                this.socket.emit('player:move', {
                    id: this.playerObj.id,
                    x: this.player.x,
                    y: this.player.y,
                    roomId: this.room.id,
                    d: this.playerObj.state.d,
                    moving: isMoving
                });
            });
        }
        this.wasMoving = isMoving;
    }


    shutdown() {
        this.cleanupSocketListeners();
    }
}
