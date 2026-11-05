
/**
 * Setup vision radius system - apply fog of war effect to map
 */
export function setupVisionSystem(scene) {
    if (!scene.player || !scene.collisionLayer) return;

    console.log('Setting up vision system...');

    // Calculate and store texture bounds for each object
    scene.mapObjectBounds = [];

    // Apply vision shader to background
    if (scene.background) {
        scene.background.setPipeline('VisionRadius');

        // Background image is positioned at (0, 0) with origin (0, 0)
        const bounds = {
            object: scene.background,
            origin: { x: 0, y: 0 },
            size: {
                width: scene.background.width,
                height: scene.background.height
            }
        };
        scene.mapObjectBounds.push(bounds);
        scene.mapObjects.push(scene.background);

        console.log('Background bounds:', bounds);
    }

    // Apply vision shader to collision layer (tilemap)
    if (scene.collisionLayer) {
        scene.collisionLayer.setPipeline('VisionRadius');

        // Tilemap layer positioned at (0, 0)
        const bounds = {
            object: scene.collisionLayer,
            origin: { x: 0, y: 0 },
            size: {
                width: scene.collisionLayer.width,
                height: scene.collisionLayer.height
            }
        };
        scene.mapObjectBounds.push(bounds);
        scene.mapObjects.push(scene.collisionLayer);

        console.log('Collision layer bounds:', bounds);
    }
}

/**
 * Disable vision system (show everything normally)
 */
export function disableVisionSystem(scene) {
    scene.visionEnabled = false;

    // Remove vision pipeline from map objects
    scene.mapObjects.forEach(obj => {
        if (obj && obj.resetPipeline) {
            obj.resetPipeline();
        }
    });

    // Show all players
    Object.values(scene.players).forEach(player => {
        player.visible = true;
    });

    // Show all dead bodies
    scene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'deadBody') {
            child.visible = true;
        }
    });
}

/**
 * Enable vision system (fog of war active)
 */
export function enableVisionSystem(scene) {
    scene.visionEnabled = true;

    // Reapply vision pipeline to map objects
    scene.mapObjects.forEach(obj => {
        if (obj && obj.setPipeline) {
            obj.setPipeline('VisionRadius');
        }
    });
}

/**
 * Update vision system uniforms every frame
 */
export function updateVisionSystem(scene) {
    if (!scene.player || !scene.cameras.main || !scene.mapObjectBounds) return;

    const pipeline = scene.game.renderer.pipelines.get('VisionRadius');
    if (!pipeline) return;

    // Update shader uniforms with player world position (same for all objects)
    pipeline.set2f('uPlayerPosition', scene.player.x, scene.player.y);
    pipeline.set1f('uVisionRadius', scene.VISION_RADIUS);

    // Set texture-specific uniforms for each map object
    scene.mapObjectBounds.forEach(bounds => {
        const obj = bounds.object;
        if (obj && obj.pipeline && obj.pipeline.name === 'VisionRadius') {
            // Set the texture origin and size for scene specific object
            obj.pipeline.set2f('uTextureOrigin', bounds.origin.x, bounds.origin.y);
            obj.pipeline.set2f('uTextureSize', bounds.size.width, bounds.size.height);
        }
    });

    // Debug logging (less frequent)
    if (scene.time.now % 1000 < 16) { // Log once per second
        console.log('Vision update:', {
            playerPos: {x: scene.player.x, y: scene.player.y},
            radius: scene.VISION_RADIUS,
            objectCount: scene.mapObjectBounds.length
        });
    }

    // Hide/show remote players based on distance
    Object.values(scene.players).forEach(player => {
        if (player === scene.player) return; // Don't hide local player

        const dist = Phaser.Math.Distance.Between(
            scene.player.x,
            scene.player.y,
            player.x,
            player.y
        );

        // Hide players outside vision radius
        player.visible = dist <= scene.VISION_RADIUS;
    });

    // Hide dead bodies outside vision radius
    scene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'deadBody') {
            const dist = Phaser.Math.Distance.Between(
                scene.player.x,
                scene.player.y,
                child.x,
                child.y
            );
            child.visible = dist <= scene.VISION_RADIUS;
        }
    });
}
