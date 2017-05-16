/**
 * Just testing to see if I can get Three.js working. This is just an unlit spinning cube.
 */

"use strict";

const {ExponentialSmoother, BeatDetector} = require('skqw-utils');
const {createCanvas, getSample, getDimensions, loadScript} = require('skqw-core');

loadScript('vendor/three/three.js');
loadScript('./CopyShader.js');
loadScript('./EffectComposer.js');
loadScript('./RGBShiftShader.js');
loadScript('./RenderPass.js');
loadScript('./ShaderPass.js');

let scene;
let camera;
let renderer;
let composer;
let smoothFt = new ExponentialSmoother(0.3);
let beatDetector = new BeatDetector(0.05, 0.2);
let bars = [];
let peakBar;
let beatBar;
let smoothedKickBar;

function init() {
    const { width, height } = getDimensions();
    const { ft } = getSample();;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, width / height, 1, 500000);
    camera.position.set(0, 0, 400);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    let canvas = createCanvas();
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(width, height);

    scene = new THREE.Scene();

    var light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(0, height / 2, 100);
    light.target.position.set(0, 0, 0);
    scene.add(light);

    ft.forEach((bucket, i) => {
        let bar = new Bar();
        bar.setPosition(width, height, i, ft.length);
        scene.add(bar.mesh);
        bars.push(bar);
    });

    peakBar = new Bar();
    peakBar.setPosition(width, height, 1, 4);
    scene.add(peakBar.mesh);
    beatBar = new Bar();
    beatBar.setPosition(width, height, 2, 4);
    scene.add(beatBar.mesh);
    smoothedKickBar = new Bar();
    smoothedKickBar.setPosition(width, height, 0, 4);
    scene.add(smoothedKickBar.mesh);

    // postprocessing
    // composer = new THREE.EffectComposer(renderer);
    // composer.addPass(new THREE.RenderPass(scene, camera));

    // rgbEffect = new THREE.ShaderPass(THREE.RGBShiftShader);
    // rgbEffect.uniforms['amount'].value = 0.0015;
    // rgbEffect.renderToScreen = true;
    // composer.addPass(rgbEffect);
}

let beatPeak = 0;
let beatPeakDecay = 0.1;

function tick(timestamp) {
    let { width, height } = getDimensions();
    let { ft, ts } = getSample();

    let smoothed = smoothFt.process(ft);
    smoothed.forEach((val, i) => {
        bars[i].setHeight(val * 400);
    });


    // beat detection stuff
    let beat = beatDetector.checkForBeat(timestamp);
    peakBar.setHeight(beatDetector.peak * 200);
    if (0 < beat) {
        /*console.log('beat!', beat);*/
        //console.log('bpm', beatDetector.getBpm());
        beatPeak = beat;
    }
    beatBar.setHeight(beatPeak * 400);
    if (beatPeakDecay < beatPeak) {
        beatPeak -= beatPeakDecay;
    }
    if (beatDetector.smoothedKick) {
        smoothedKickBar.setHeight(beatDetector.smoothedKick.outputSum * 200);
    }

    // composer.render(scene, camera);
    renderer.render(scene, camera);
}

function resize() {
    let { width, height } = getDimensions();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    bars.forEach((bar, i) => {
        bar.setPosition(width, height, i, bars.length);
    })
}

class Bar {

    constructor() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial();
        this.mesh = new THREE.Mesh(geometry, material);
    }

    setPosition(sceneWidth, sceneHeight, index, totalBars) {
        const spacing = sceneWidth / 800;
        const barWidth = sceneWidth / totalBars;
        const xOffset = (barWidth + spacing) * index - sceneWidth / 2 - totalBars * spacing / 2;
        this.baseY = -sceneHeight / 2;
        this.mesh.scale.set(barWidth, 1, 1);
        this.mesh.position.set(xOffset, this.baseY, 0);
    }

    setHeight(val) {
        let height = Math.max(val, 1);
        this.mesh.scale.y = height;
        this.mesh.position.y = height / 2 + this.baseY;
        this.mesh.material.color.setHSL(val / 2000, 0.5, 0.5);
    }
}

module.exports = {
    name: '3d Bars',
    init,
    tick,
    resize,
    destroy() {
        // delete window.THREE;
    }
};
