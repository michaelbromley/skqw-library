const {createCanvas, getSample, getDimensions} = require('skqw-core');
const {ExponentialSmoother} = require('skqw-utils');

// The Three library can be downloaded and saved in the same folder as the visualization script.
const THREE = require('vendor/three');
window.THREE = THREE;

const params = {
    hue: {
        type: 'range',
        label: 'Hue',
        value: 0,
        min: 0,
        max: 359
    }
}

let scene;
let camera;
let renderer;
let bufferScene;
let textureA;
let textureB;
let bufferMaterial;
let quad;
const smoothFt = new ExponentialSmoother(0.15);
const smoothTs = new ExponentialSmoother(0.8);
const smoothVol = new ExponentialSmoother(0.024);

function init() {
    const { width, height } = getDimensions();

    let plane;
    let bufferObject;
    let finalMaterial;

    function scene_setup() {
        //This is the basic scene setup
        scene = new THREE.Scene();
        //Note that we're using an orthographic camera here rather than a prespective
        camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
        camera.position.z = 2;
        let canvas = createCanvas();
        renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        renderer.setSize(width, height);
    }

    //Initialize the Threejs scene
    scene_setup();

    function buffer_texture_setup() {
        //Create buffer scene
        bufferScene = new THREE.Scene();
        //Create 2 buffer textures
        textureA = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
        textureB = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
        //Pass textureA to shader
        bufferMaterial = new THREE.ShaderMaterial(TestShader);
        plane = new THREE.PlaneBufferGeometry(width, height);
        bufferObject = new THREE.Mesh(plane, bufferMaterial);
        bufferScene.add(bufferObject);

        //Draw textureB to screen 
        finalMaterial = new THREE.MeshBasicMaterial({ map: textureB.texture });
        quad = new THREE.Mesh(plane, finalMaterial);
        scene.add(quad);
    }
    buffer_texture_setup();
    
    resize();
}

function tick(timestamp) {
    const { ft, ts } = getSample();
    const newFt = smoothFt.process(ft);
    bufferMaterial.uniforms.vol.value = smoothVol.sumAndProcess(ft);
    bufferMaterial.uniforms.ft.value = newFt;
    bufferMaterial.uniforms.hue.value = params.hue.value;
    bufferMaterial.uniforms.time.value = timestamp;

    if (renderer) {
        //Draw to textureB
        renderer.render(bufferScene, camera, textureB, true);

        //Swap textureA and B
        var t = textureA;
        textureA = textureB;
        textureB = t;
        quad.material.map = textureB.texture;
        bufferMaterial.uniforms.bufferTexture.value = textureA;

        //Finally, draw to the screen
        renderer.render(scene, camera);
    }
}

function resize() {
    const { width, height } = getDimensions();
    renderer.setSize( width, height );
    TestShader.uniforms.resolution.value.x = width;
    TestShader.uniforms.resolution.value.y = height;
}

const TestShader = {

	uniforms: {
        bufferTexture: { type: "t", value: textureA },
		resolution: { type: 'v2', value: new THREE.Vector2() },
        vol: { type: 'f', value: 0.0 },
        hue: { type: 'f', value: 0.0 },
        ft: { type: 'uFloatArray', value: new Array(128).map(() => 0) },
        time: { type: 'f', value: 0.0 }
	},

	fragmentShader: `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform sampler2D bufferTexture;
    uniform vec2 resolution;
    uniform float vol;
    uniform float hue;
    uniform float ft[128];
    uniform float time;

    float rectangle(in vec2 st, in vec2 origin, in vec2 dimensions) {
        vec2 bl = step(origin,  st);
        float pct = bl.x * bl.y;
        vec2 tr = step(1.0 - origin - dimensions, 1.0 - st);
        pct *= tr.x * tr.y;
        return pct;
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

	void main() {
        const float step = 1.0 / (128.0);
        const float gutter = 0.0005;

        vec2 st = gl_FragCoord.xy/resolution.xy;
        float yPixel = 1.0/resolution.y;
        float xPixel = 1.0/resolution.x;
       
        vec4 rightColor = texture2D(bufferTexture,vec2(st.x+xPixel,st.y));
	    vec4 leftColor = texture2D(bufferTexture,vec2(st.x-xPixel,st.y));
	    vec4 upColor = texture2D(bufferTexture,vec2(st.x,st.y+yPixel));
	    vec4 downColor = texture2D(bufferTexture,vec2(st.x + xPixel * sin(st.y * 30.0 * st.x),st.y- yPixel * 10.0 * (st.y + 0.5)));
        // gl_FragColor = texture2D( bufferTexture, vec2(st.x - xPixel, st.y - yPixel * 2.0) ) * 0.95;
        gl_FragColor = (rightColor + leftColor + upColor * 0.2 + downColor * 1.7) * 0.24;
        
        float r = (sin(vol / 10.0) + 1.0) / 2.0;
        float hueN = hue / 360.0;
        float bar;
        int bin = int(floor(st.x / step));
        float remainder = mod(st.x, step);
        float color = 0.0; 
        vec3 color3 = hsv2rgb(vec3(hueN + 0.5, .8, (vol / 500.0))) * (1.0 - st.y);
        for (int i = 0; i < 128; i++) {
            if (i == bin) {
                bar = clamp(log2(ft[i] / 5.0 + 1.01), 0.0, 1.0);
                float h = sin(bar / 10.0) * 2.0 + hueN;
                color += rectangle(st, vec2(st.x, 0.0), vec2(step, bar));
                if (st.y < bar) {
                    color3 = hsv2rgb(vec3(h, 0.9, color));
                }
            }
        }
       
		gl_FragColor = vec4(max(color3, gl_FragColor.rgb), 1.0);
	}`
};

module.exports = {
    name: 'Shader Bars',
    init,
    tick,
    resize,
    params
};
