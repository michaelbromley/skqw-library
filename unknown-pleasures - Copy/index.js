/**
 * Just testing to see if I can get Three.js working. This is just an unlit spinning cube.
 */

"use strict";

const {createCanvas, getSample, getDimensions, loadScript} = require('skqw-core');
const { ExponentialSmoother } = require('skqw-utils');

window.THREE = require('vendor/three/three.js');
loadScript('./THREE.MeshLine.js');
loadScript('./OrbitControls.js');

let scene;
let camera;
let renderer;
let controls;
let geometry;
let line;
const scale = 10;
let smoother = new ExponentialSmoother(0.5);

const params = {
    param1: {
        label: 'Param 1',
        type: 'range',
        min: 0,
        max: 100,
        value: 0
    }
}

function init() {
    const { width, height } = getDimensions();
    const { ft, ts } = getSample();;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, width / height, 10, 5000);
    camera.position.set(0, 0, 700000/width);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    let canvas = createCanvas();
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(width, height);


    scene = new THREE.Scene();

    var light = new THREE.PointLight( 0xff0000, 1, 100 );
    light.position.set( 10, 50, 50 );
    scene.add(light);

    let length = ts.length;

    geometry = new THREE.Geometry();
    geometry.dynamic = true;

    for(let j = 0; j < length; j ++ ) {
        var v = new THREE.Vector3(-(length / 2 * scale) + j * scale, 0, 0);
        geometry.vertices.push( v );
    }
    line = new MeshLine();
    line.setGeometry( geometry );
    line.lineWidth = 2;
    line.sizeAttenuation = 1;

    var material = new MeshLineMaterial();
    var mesh = new THREE.Mesh(line.geometry, material);
    scene.add( mesh );

    controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function tick(timestamp) {
    let { width, height } = getDimensions();
    let { ft, ts } = getSample();
    let wave = smoother.process(ts);

    if (geometry) {
        let length = ts.length;
        for (let j = 0; j < length; j++) {
            let v = geometry.vertices[j];
            v.set(
                -(length / 2 * scale) + j * scale + Math.sin(params.param1.value / 5 * j) * params.param1.value,
                wave[j] * 1000 + (Math.tan(params.param1.value / 5 * j) * params.param1.value),
                0);
        }
        line.setGeometry(geometry);
    }
    renderer.render(scene, camera);
}

function resize() {
    let { width, height } = getDimensions();
    renderer.setSize(width, height);
}

module.exports = {
    name: 'Line Test',
    params,
    init,
    tick,
    resize
};
