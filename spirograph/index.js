/**
 * Author: Michael Bromley
 * Version: 1
 */
let ctx;
let params = {
    sensitivity: {
        value: 50,
        type: 'range',
        label: 'Sensitivity',
        min: 1,
        max: 100
    },
};
let initDone = false;
let minDimension = 0;
let acc = 0;
let counter = 0;

let graphVal = 0;
let graphV = 0;
const GRAPH_DECAY = 0.1;

function init(skqw) {
    ctx = skqw.createCanvas().getContext('2d');

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

    let volume = 0;
    for (let i = 0; i < ft.length; i ++) {
        volume += ft[i];
    }
    let delta = volume - acc;
    acc += delta / 10;

    ctx.fillStyle = `hsla(0, 0%, 0%, 0.5)`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    //pattern1(acc, width, height);
    pattern2(acc);
    counter ++;
}

function pattern1(volume) {
    const delta = volume - graphV;
    const baseFactor = minDimension / 200;

    if (0 < delta && graphV < 2) {
        graphV += delta / 1000;
    } else if (-2 < graphV) {
        graphV -= GRAPH_DECAY;
    }
    graphVal += graphV / 100;

    const n = 17 + Math.sin(graphVal / 100) * 2;
    const k =  5 + Math.sin(graphVal / 100) * 2;
    const radius = 180 * baseFactor;

    ctx.beginPath();

    for (let t = 0; t <= 12; t += 0.01) {
        let x = ((Math.sin(volume / 6000) - k) * Math.cos(k * t) * radius + k * Math.cos((n - k) * t) * radius) / n;
        let y = ((Math.cos(volume / 6000) - k) * Math.sin(k * t) * radius + k * Math.sin((n - k) * t) * radius) / n;

        if (t === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = `hsla(${volume / 3 + graphVal}, ${50}%, 50%, ${Math.log2(volume + 0.5) / 30})`;
    ctx.stroke();
}

function pattern2(volume) {
    let b = Math.sin(counter / 1000) * 5 + 10 + Math.log2(volume / 500 + 0.5);
    const f = x => 6 * Math.cos(x);
    const g = x => Math.sin(b * x);
    const radius = minDimension / 8;




    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 10) {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${a * 20}, 50%, 50%, 0.9)`;
        for (let t = 0; t <= 6.29; t += 0.2) {
            let x = (f(t) * Math.cos(a) - g(t) * Math.sin(a)) * radius;
            let y = (f(t) * Math.sin(a) + g(t) * Math.cos(a)) * radius;
            if (t === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

        }
        ctx.stroke();
    }

}

function resize(skqw) {
    if (ctx) {
        let {width, height} = skqw.dimensions;
        ctx.lineWidth = width / 600;
        ctx.translate(width/2, height/2);
        minDimension = Math.min(width, height);
    }
}

function paramChange(change) {
    params[change.paramKey].value = change.newValue;
}

function destroy() {
    initDone = false;
}

module.exports = {
    name: 'Spirograph',
    init,
    tick,
    resize,
    paramChange,
    destroy,
    params
};
