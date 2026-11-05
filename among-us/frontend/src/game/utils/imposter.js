import { EventBus } from "../EventBus.js";

/**
 * Initialize imposter-specific UI and mechanics
 * Sets up kill button and detection zone for the imposter
 */
export function handleImposter(scene) {
    console.log("Ran handleImposter with", scene.imposter, scene.player);
    if (!scene.imposter || !scene.player) return;

    console.log("Setting up imposter", scene.player, scene.imposter);

    const KILL_ZONE_RADIUS = 60; // pixels

    // Kill button click handler
    const handleKill = () => {
        const victim = scene.closest && scene.closest.player;
        if (!victim) return;

        // Send kill event to server with victim and killer data
        const payload = {
            playerId: victim.id,           // victim id
            killerId: scene.playerObj?.id,  // killer id
            roomId: scene.playerObj.roomId,
            x: victim.x,
            y: victim.y,
            color: scene.playerObj.color
        };
        console.log('Emitting player:kill', payload);
        scene.socket.emit('player:kill', payload);

        scene.player.x = victim.x;
        scene.player.y = victim.y;

        // Reset closest player tracking
        scene.closest = { player: null, distance: KILL_ZONE_RADIUS };
    };

    // Create kill button UI
    scene.killBtn = scene.add.image(820, 410, 'kill')
        .setScale(0.7)
        .setDepth(1000)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', handleKill);
    scene.ui.add(scene.killBtn);
    console.log("Kill button created", scene.killBtn);

    // Create invisible detection zone around imposter
    scene.zone = scene.physics.add.sprite(scene.player.x, scene.player.y, 100, 100);
    if (scene.zone.body) {
        scene.zone.body.setCircle(KILL_ZONE_RADIUS);
        scene.zone.body.setAllowGravity(false);
        scene.zone.visible = false;
    }
}

export function handleImposterMovement(scene) {
    // Update imposter kill zone if player is imposter
    if (scene.imposter && scene.zone && scene.player) {
        scene.zone.setPosition(scene.player.x, scene.player.y);
        handleNearestPlayer(scene);
    }

    // Update kill button visual state based on whether a target is in range
    if (scene.killBtn) {
        if (!scene.closest.player && scene.killBtn.pipeline?.name !== 'GrayScale') {
            scene.killBtn.setPipeline('GrayScale');
        } else if (scene.closest.player && scene.killBtn.pipeline?.name === 'GrayScale') {
            scene.killBtn.resetPipeline();
        }
    }
}

/**
 * Track the nearest player within kill range for the imposter
 * Updates scene.closest with the nearest valid target
 */
export function handleNearestPlayer(scene) {
    const KILL_ZONE_RADIUS = 60; // pixels

    Object.values(scene.players).forEach(p => {
        const dist = Phaser.Math.Distance.Between(scene.zone.x, scene.zone.y, p.x, p.y);

        // Player moved out of range
        if (dist > KILL_ZONE_RADIUS) {
            if (p === scene.closest.player) {
                scene.closest = { player: null, distance: KILL_ZONE_RADIUS };
                console.log("No closest player");
            }
            return;
        }

        // Found closer player (excluding self)
        if (dist < scene.closest.distance && p !== scene.player) {
            if (scene.closest.player !== p) {
                console.log("New closest player:", scene.closest);
            }
            scene.closest = { player: p, distance: dist };
        }
    });
}
