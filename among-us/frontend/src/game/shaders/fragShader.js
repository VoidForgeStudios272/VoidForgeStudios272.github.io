const fragShader = `
        precision mediump float;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;
        uniform vec3 uColor;

        void main() {
            vec4 textureColor = texture2D(uMainSampler, outTexCoord);

            // 1. CHECK FOR RED (The Main Body)
            if (textureColor.r > 0.4 && textureColor.g < 0.4 && textureColor.b < 0.4) {
                // Replace with chosen color
                gl_FragColor = vec4(uColor * textureColor.r, textureColor.a);
            }
            // 2. CHECK FOR BLUE (The Shadow/Legs)
            else if (textureColor.b > 0.4 && textureColor.r < 0.4 && textureColor.g < 0.4) {
                // Replace with the SAME chosen color, but Darker (multiply by 0.5)
                vec3 shadowColor = uColor * 0.5;
                gl_FragColor = vec4(shadowColor * textureColor.b, textureColor.a);
            }
            // 3. EVERYTHING ELSE (Visor, Outline)
            else {
                gl_FragColor = textureColor;
            }
        }
    `;
// 2. Register the Pipeline (We give it a name 'ColorSwap')
const ColorSwapPipeline = new Phaser.Class({
    Extends: Phaser.Renderer.WebGL.Pipelines.SinglePipeline,
    initialize: function (game) {
        Phaser.Renderer.WebGL.Pipelines.SinglePipeline.call(this, {
            game: game,
            fragShader: fragShader,
            // SinglePipeline expects an array of uniform names in recent Phaser versions
            uniforms: ['uColor'] // We will control this variable
        });
    }
});
export {ColorSwapPipeline};

const grayFragShader = `
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    // standard luminance formula
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(gray), color.a);
}
`;

// 2. Register the Pipeline
const GrayPipeline = new Phaser.Class({
    Extends: Phaser.Renderer.WebGL.Pipelines.SinglePipeline,
    initialize: function (game) {
        Phaser.Renderer.WebGL.Pipelines.SinglePipeline.call(this, {
            game: game,
            fragShader: grayFragShader
        });
    }
});

export { GrayPipeline };

// Vision Radius Shader - Creates fog of war effect
const visionRadiusFragShader = `
#define SHADER_NAME VISION_RADIUS_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uPlayerPosition;      // Player position in world coordinates
uniform float uVisionRadius;       // Vision radius in world units
uniform vec2 uTextureOrigin;       // Texture's world position (x, y)
uniform vec2 uTextureSize;         // Texture's size in world units (width, height)

varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);

    // Convert texture UV coordinate (0-1) to world coordinates
    vec2 worldPos = uTextureOrigin + (outTexCoord * uTextureSize);

    // Calculate distance from player in world space
    float dist = distance(worldPos, uPlayerPosition);

    // Vision radius with smooth falloff
    float falloffStart = uVisionRadius * 0.6;  // Inner radius (full brightness)
    float falloffEnd = uVisionRadius;          // Outer radius (full darkness)

    // Calculate visibility factor (1.0 = visible, 0.0 = hidden)
    float visibility = 1.0 - smoothstep(falloffStart, falloffEnd, dist);

    // Convert to grayscale outside vision
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 grayColor = vec3(gray) * 0.3; // Darken the grayscale

    // Mix between colored and dark grayscale based on visibility
    vec3 finalColor = mix(grayColor, color.rgb, visibility);

    gl_FragColor = vec4(finalColor, color.a);
}
`;

const VisionRadiusPipeline = new Phaser.Class({
    Extends: Phaser.Renderer.WebGL.Pipelines.SinglePipeline,
    initialize: function (game) {
        Phaser.Renderer.WebGL.Pipelines.SinglePipeline.call(this, {
            game: game,
            fragShader: visionRadiusFragShader,
            uniforms: [
                'uPlayerPosition',
                'uVisionRadius',
                'uTextureOrigin',
                'uTextureSize'
            ]
        });
    }
});

export { VisionRadiusPipeline };
