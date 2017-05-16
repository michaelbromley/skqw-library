const {createCanvas, getSample, getDimensions} = require('skqw-core');

/** @type {CanvasRenderingContext2D} */
let ctx;

const params = {
    ft: {
        type: 'boolean',
        value: 'true',
        label: 'Show FFT'
    }
}

function init() {
    ctx = createCanvas().getContext('2d');
}

function tick() {
    const { width, height } = getDimensions();
    const { ft } = getSample();
    // clear the canvas.
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);
    
    if (params.ft.value) {
        drawFt(width, height, ft);
    }
}

function drawFt(w, h, ft) {
    const length = ft.length;
    const width = w / length;

    const factor = 10;

    // draw the y axis
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(10, h);
    ctx.lineTo(10, h - 100 * factor);
    ctx.stroke();

    // draw the value markers
    ctx.font = "12px Arial";
    for (let i = 0; i <=100; i += 10) {
        const val = i * factor;
        ctx.beginPath();
        ctx.moveTo(10, h - val);
        ctx.lineTo(20, h - val);
        ctx.stroke();
        ctx.fillStyle = 'green';
        ctx.fillText(i, 15, h - val - 5);
    }
    
    // The bars will be red
    ctx.fillStyle = `hsla(0, 50%, 50%, 0.8)`;
    for(let i = 0; i < ft.length; i++) {
        const height = ft[i] * factor;
        const x = i * width;
        const y = h - height;
        ctx.fillRect(x, y, width - 2, height);
    }
}

module.exports = {
    name: 'Feature Test',
    init,
    tick,
    params
};