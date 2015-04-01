/**
 * @author huwb / http://huwbowles.com/
 */
THREE.ShaderGodRays = {
    'godrays_generate': {
        uniforms: {
            tInput: {
                type: "t",
                value: null
            },
            fStepSize: {
                type: "f",
                value: 1.0
            },
            vSunPositionScreenSpace: {
                type: "v2",
                value: new THREE.Vector2(0.5, 0.5)
            }
        },
        vertexShader: ["varying vec2 vUv;",
                       "void main() {",
                       "vUv = uv;",
                       "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                       "}"].join("\n"),
        fragmentShader: ["#define TAPS_PER_PASS 6.0", "varying vec2 vUv;",
                         "uniform sampler2D tInput;",
                         "uniform vec2 vSunPositionScreenSpace;",
                         "uniform float fStepSize;",
                         "void main() {",
                         "vec2 delta = vSunPositionScreenSpace - vUv;",
                         "float dist = length( delta );",
                         "vec2 stepv = fStepSize * delta / dist;",
                         "float iters = dist/fStepSize;",
                         "vec2 uv = vUv.xy;",
                         "float col = 0.0;", "if ( 0.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "if ( 1.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "if ( 2.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "if ( 3.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "if ( 4.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "if ( 5.0 <= iters && uv.y < 1.0 ) col += texture2D( tInput, uv ).r;",
                         "uv += stepv;",
                         "gl_FragColor = vec4( col/TAPS_PER_PASS );",
                         "gl_FragColor.a = 1.0;",
                         "}"].join("\n")
    },
    'godrays_combine': {
        uniforms: {
            tColors: {
                type: "t",
                value: null
            },
            tGodRays: {
                type: "t",
                value: null
            },
            fGodRayIntensity: {
                type: "f",
                value: 0.69
            },
            vSunPositionScreenSpace: {
                type: "v2",
                value: new THREE.Vector2(0.5, 0.5)
            }
        },
        vertexShader: ["varying vec2 vUv;",
                       "void main() {", "vUv = uv;",
                       "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                       "}"].join("\n"),
        fragmentShader: ["varying vec2 vUv;",
                         "uniform sampler2D tColors;",
                         "uniform sampler2D tGodRays;",
                         "uniform vec2 vSunPositionScreenSpace;",
                         "uniform float fGodRayIntensity;",
                         "void main() {",
                         "gl_FragColor = texture2D( tColors, vUv ) + fGodRayIntensity * vec4( 1.0 - texture2D( tGodRays, vUv ).r );",
                         "gl_FragColor.a = 1.0;", "}"].join("\n")
    }
};