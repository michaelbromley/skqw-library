const { ExponentialSmoother } = require('skqw-utils');
const {createCanvas, getSample, getDimensions, loadScript} = require('skqw-core');

const THREE = require('./three');
window.THREE = THREE;
loadScript('./SkyShader.js');
const path = require('path');

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
const logoFile = require('./logo-model.js');
let logoObject;
let scaleFactor;
const smoothVol = new ExponentialSmoother(0.1);
let sky;

const params = {
    z: {
        label: 'z',
        type: 'range',
        min: 50,
        max: 1000,
        value: 2000
    },
    rayleigh: {
        label: 'Rayleigh',
        type: 'range',
        min: 0,
        max: 4,
        step: 0.001,
        value: 2
    }
}

function init() {
    const { width, height } = getDimensions();
    const { ft } = getSample();

    setScaleFactor(width);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, width / height, 1, 200000000);

    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    let canvas = createCanvas();
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(width, height);

    let light = new THREE.PointLight(0xff0000, 1, 100);
    light.position.set(10, 50, 50);
    scene.add(light);

    // instantiate a loader
    var loader = new THREE.ObjectLoader();
    logoObject = loader.parse(logoFile);
    logoObject.geometry.center();
    scene.add(logoObject);


    // sky stuff
    sky = new THREE.Sky();
    scene.add(sky.mesh);

    var effectController = {
        turbidity: 10,
        rayleigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
        inclination: 0.49, // elevation / inclination
        azimuth: 0.25, // Facing front,
        sun: ! true
    };

    // Add Sun Helper
    sunSphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(20000, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunSphere.position.y = - 700000;
    sunSphere.visible = false;
    scene.add(sunSphere);
    var distance = 400000;

    var uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    var theta = Math.PI * (effectController.inclination - 0.5);
    var phi = 2 * Math.PI * (effectController.azimuth - 0.5);
    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = effectController.sun;

    sky.uniforms.sunPosition.value.copy(sunSphere.position);
}

function tick(timestamp) {
    let { width, height } = getDimensions();
    let { ft, ts } = getSample();
    let vol = smoothVol.sumAndProcess(ft);
    let scale = Math.log2(vol + 2) * scaleFactor;
    logoObject.scale.set(scale, scale, (scale + 0.8) ** 6);
    if (renderer) {
        renderer.render(scene, camera);
    }
}

function resize() {
    let { width, height } = getDimensions();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    setScaleFactor(width);
}

function paramChange(change) {
    params[change.paramKey].value = change.newValue;
    switch (change.paramKey) {
        case 'z':
            camera.position.z = change.newValue;
            break;
        case 'rayleigh':
            sky.uniforms.rayleigh.value = change.newValue;
            break;
    }
}

function destroy() {
    // delete window.THREE;
}

function setScaleFactor(width) {
    scaleFactor = width / 15000;
    console.log('scaleFactor', scaleFactor);
}

module.exports = {
    name: '3d Default',
    params,
    paramChange,
    init,
    tick,
    resize,
    destroy
};
