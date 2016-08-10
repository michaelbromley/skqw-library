/**
 * Author: Michael Bromley
 * Version: 1
 */
let ctx;
let ctxBuffer;
let params = {
    sensitivity: {
        value: 50,
        type: 'range',
        label: 'Sensitivity',
        min: 1,
        max: 100
    },
    blur: {
        value: 10,
        type: 'range',
        label: 'Blur',
        min: 0,
        max: 20
    },
    hue: {
        value: 160,
        type: 'range',
        label: 'Hue',
        min: 1,
        max: 360
    },
};
let initDone = false;
let minDimension = 0;
let accu = 0;
let counter = 0;
const DELAY = 1;
const buffer = [];

function init(skqw) {
    ctx = skqw.createCanvas().getContext('2d');
    ctxBuffer = document.createElement('canvas').getContext('2d');
    setTimeout(() => {
        resize(skqw);
        initDone = true;
    });
    ctx.lineCap = 'round';
}

function tick(skqw) {
    if (!initDone) {
        return;
    }
    const { width, height } = skqw.dimensions;
    const ft = skqw.sample.ft;

    buffer.unshift(skqw.sample.ts);
    if (DELAY * 2 + 2 < buffer.length) {
        buffer.pop();
    }
    let volume = 0;
    for (let i = 0; i < ft.length; i ++) {
        volume += ft[i];
    }
    let delta = volume - accu;
    accu += delta / 10;

    let saturation = Math.min(90, volume / 2);


    ctxBuffer.save();
    ctxBuffer.clearRect(-width / 2, -height / 2, width, height);
    ctxBuffer.globalAlpha = 0.79 + params.blur.value / 100;
    ctxBuffer.scale(1.01, 1.01);
    ctxBuffer.drawImage(ctx.canvas, -width / 2, -height / 2);
    ctx.clearRect(-width / 2, -height / 2, width, height);
    ctx.drawImage(ctxBuffer.canvas, -width / 2, -height / 2);
    ctxBuffer.restore();

    drawBars(height, ft, accu);

    ctx.strokeStyle = `hsla(${params.hue.value}, ${saturation}%, 50%, 1)`;
    drawCircle(height, buffer[0], volume);

    ctx.strokeStyle = `hsla(${accu / 8 + params.hue.value}, ${saturation}%, 50%, 1)`;
    drawCircle(height, buffer[DELAY + 1], volume);

    ctx.strokeStyle = `hsla(${accu / 5 + params.hue.value}, ${saturation}%, 50%, 1)`;
    drawCircle(height, buffer[DELAY * 2 + 1], volume);

    counter ++;
}

function drawCircle(h, ts, volume) {
    if (!ts) {
        return;
    }
    const r = minDimension / 2 * 0.6;
    const length = ts.length;
    let p1 = circlePoint(ts, length - 2, r, volume);
    let p2 = circlePoint(ts, length - 1, r, volume);
    let mid = midPoint(p1, p2);
    const start = midPoint(p1, p2);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    for(let i = 2; i < length; i++) {
        mid = midPoint(p1, p2);
        ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
        p1 = circlePoint(ts, i, r, volume);
        p2 = circlePoint(ts, (i + 1), r, volume);
    }
    ctx.quadraticCurveTo(p1.x, p2.y, start.x, start.y);
    ctx.stroke();
}

function circlePoint(ts, i, r, volume) {
    const length = ts.length;
    const radialOffset = Math.PI / 2;
    const adjustedR = r + ts[i] * params.sensitivity.value + volume / 2;
    const x = adjustedR * Math.cos(2 * Math.PI * i / length + radialOffset);
    const y = adjustedR * Math.sin(2 * Math.PI * i / length + radialOffset);
    return { x, y };
}

function midPoint(p1, p2) {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2
    };
}

function drawBars(h, ft, volume) {
    if (!ft) {
        return;
    }
    const r = h / 2 * 0.8;

    ctx.strokeWidth = minDimension / 200;
    const length = ft.length;
    for(var i = 0; i < length; i++) {
        ctx.strokeStyle = `hsla(${params.hue.value + 60 + ft[i] * 10}, 50%, 50%, ${Math.min(volume / 200, 0.3)})`;
        const adjustedR = r + ft[i] * params.sensitivity.value + volume;
        const delta = adjustedR - r;
        let p1 = barPoint(length, i, r - delta * 0.2);
        let p2 = barPoint(length, i, r + delta * 0.8);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

function barPoint(length, i, r) {
    i -= Math.round(counter / 20);
    const x = r * Math.cos(2 * Math.PI * i / length);
    const y = r * Math.sin(2 * Math.PI * i / length);
    return { x, y };
}

function resize(skqw) {
    if (ctx) {
        let {width, height} = skqw.dimensions;
        ctxBuffer.canvas.width = width;
        ctxBuffer.canvas.height = height;
        ctxBuffer.translate(width/2, height/2);
        ctx.lineWidth = width / 600;
        ctx.translate(width/2, height/2);
        minDimension = Math.min(width, height);
    }
}

function paramChange(skqw, change) {
    params[change.paramKey].value = change.newValue;
}

function destroy() {
    initDone = false;
}

module.exports = {
    name: 'Eclipse',
    init,
    tick,
    resize,
    paramChange,
    destroy,
    params
};
