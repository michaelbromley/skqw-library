/**
 * Just testing to see if I can get Three.js working. This is just an unlit spinning cube.
 */

"use strict";

const {createCanvas, getSample, getDimensions, loadScript} = require('skqw-core');

loadScript('./three.js');
loadScript('./CopyShader.js');
loadScript('./EffectComposer.js');
loadScript('./RGBShiftShader.js');
loadScript('./RenderPass.js');
loadScript('./ShaderPass.js');

let scene;
let camera;
let renderer;
let composer;
let rgbEffect;
let lastTimestamp = 0;
let spectra = [];
let buffer = [];
let dampedVol = 0;
const COUNT = 50;

function init() {
    const { width, height } = getDimensions();
    const { ft } = getSample();;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, width / height, 10, 5000);
    camera.position.set(0, 100, 10);
    camera.lookAt(new THREE.Vector3(0, 10, -100));
    let canvas = createCanvas();
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(width, height);


    scene = new THREE.Scene();

    var light = new THREE.PointLight( 0xff0000, 1, 100 );
    light.position.set( 10, 50, 50 );
    scene.add( light );

    for (let i = 0; i < COUNT; i++) {
        let length = ft.length;
        let spectrum = new Spectrum(length, i);
        spectra.push(spectrum);
        scene.add(spectrum.line)
        buffer.push(Array(length).fill(0));
    }

    
    // postprocessing
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    rgbEffect = new THREE.ShaderPass(THREE.RGBShiftShader);
    rgbEffect.uniforms['amount'].value = 0.0015;
    rgbEffect.renderToScreen = true;
    composer.addPass(rgbEffect);
}

function tick(timestamp) {
    let { width, height } = getDimensions();
    let { ft, ts } = getSample();
    let timeDelta = timestamp - lastTimestamp;
    const volume = ft.reduce((a, b) => a + b);
    const delta = volume - dampedVol;
    dampedVol += delta / 10;
    rgbEffect.uniforms[ 'amount' ].value = dampedVol / 10000;
    

    let step = width / ft.length;

    spectra.forEach((spectrum, z) => {
        spectrum.line.geometry.attributes.position.needsUpdate = true;
        let positions = spectrum.line.geometry.attributes.position.array;
        let previous = buffer[0].slice();
        if (z === 0 && 30 < timeDelta) {
            lastTimestamp = timestamp;
            buffer.unshift(previous);
            buffer.pop();
        }
        ft.forEach((val, i) => {

            if (z === 0) {
                // compute the damped ft values
                const delta = val - buffer[0][i];
                buffer[0][i] += delta / 10;
            }

            let xIndex = i * 3;
            let yIndex = i * 3 + 1;
            let zIndex = i * 3 + 2;
            positions[xIndex] = i * step - width / 2;
            positions[yIndex] = buffer[z][i] * 100;
            positions[zIndex] = -1500 + z * 40;
            //positions[zIndex] = z * -40;
        });

    });

    composer.render(scene, camera);
}

function resize() {
    let { width, height } = getDimensions();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

class Spectrum {

    constructor(MAX_POINTS, z) {
        let colorVal = '99';
        let positions = new Float32Array(MAX_POINTS * 3);
        let material = new THREE.LineBasicMaterial({ color: parseInt(`0x${colorVal}${colorVal}${colorVal}`) });
        this.geometry = new THREE.BufferGeometry();
        this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setDrawRange(0, MAX_POINTS);
        this.line = new THREE.Line(this.geometry, material);
    }
}

module.exports = {
    name: 'Three.js Test',
    init,
    tick,
    resize,
    destroy() {
        // delete window.THREE;
    }
};
