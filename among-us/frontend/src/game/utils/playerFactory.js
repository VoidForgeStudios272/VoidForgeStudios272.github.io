import { ColorSwapPipeline } from '../shaders/fragShader.js';

export function setPlayerColor(scene, sprite, color) {
    const rgb = Phaser.Display.Color.HexStringToColor(color);
    const r = rgb.red / 255;
    const g = rgb.green / 255;
    const b = rgb.blue / 255;
    sprite.clearTint();
    const pipelineName = `ColorSwap_${Date.now()}_${Math.random()}`;
    scene.renderer.pipelines.add(pipelineName, new ColorSwapPipeline(scene.game));
    sprite.setPipeline(pipelineName);
    sprite.pipeline.set3f('uColor', r, g, b);
    sprite.setBlendMode(Phaser.BlendModes.OVERLAY);
}

export function createPlayer(scene, playerData, options = {}) {
    const { addCollision = false, collisionLayer = null } = options;

    const player = scene.physics.add.sprite(
        playerData.x,
        playerData.y,
        'player',
        'Walk0001.png'
    );
    scene.worldContainer.add(player);

    if (addCollision && collisionLayer) {
        scene.physics.add.collider(player, collisionLayer);
    }

    player.setScale(0.1, 0.1);
    player.body.setSize(player.width * 0.4, player.height * 0.6);
    player.body.setOffset(player.width * 0.3, player.height * 0.2);

    setPlayerColor(scene, player, playerData.color);

    return player;
}
