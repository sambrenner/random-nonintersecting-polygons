const SVG = require('@svgdotjs/svg.js');
const hull = require('hull.js');
const Noise = require('noisejs').Noise;

let draw;

let output;
let seedOutput;

let noise;

const config = {
  noise: [],
  threshold: .9,
  concavity: 40,
  resolution: 1,
  rectilinear: false,
  seed: null
};

document.addEventListener('DOMContentLoaded', () => {
  draw = new SVG.Svg()
    .addTo('#svg-holder')
    .size(304, 304);

  output = document.querySelector('#output');
  seedOutput = document.querySelector('#seed');

  document.querySelector('#regen').addEventListener('click', e => {
    e.preventDefault();

    reseed();
    generatePoints();
    drawPoly();
  });

  [...document.querySelectorAll('input')].forEach(input => {
    input.addEventListener('input', e => {
      const key = e.target.dataset.controls;
      const val = e.target.type === 'checkbox'
        ? e.target.checked
        : parseFloat(e.target.value);

      config[key] = val;

      if (e.target.dataset.shouldRegenerate) {
        if (key === "seed") {
          console.log(val);
          reseed(val);
        }

        generatePoints();
      }

      drawPoly();
    });
  });

  reseed();
  generatePoints();
  drawPoly();
});

const reseed = (seed) => {
  config.seed = seed || Math.floor(Math.random() * 65536);
  noise = new Noise(config.seed);
  seedOutput.value = config.seed;
}

const generatePoints = () => {
  config.noise = [];

  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      const val = Math.abs(noise.simplex2(
        Math.floor(x / config.resolution),
        Math.floor(y / config.resolution)
      ));

      config.noise.push(val);
    }
  }
}

const drawPoly = () => {
  draw.clear();

  const points = [];

  for (let i = 0; i < config.noise.length; i++) {
    if (config.noise[i] >= config.threshold) {
      const x = i % 100;
      const y = Math.floor(i / 100);

      points.push([2 + x * 3, 2 + y * 3]);
    }
  }

  if (!points.length) return;

  let outline = hull(points, config.concavity);

  if (config.rectilinear) {
    outline = outline.reduce((acc, curr, idx, src) => {
      acc.push(curr);

      if (idx < src.length - 1) {
        const next = src[idx + 1];
        acc.push([curr[0], next[1]]);
      }

      return acc;
    }, []);
  }

  draw
    .polyline(outline)
    .fill('none')
    .stroke({
      color: '#000',
      width: 2,
      linecap: 'round',
      linejoin: 'round'
    });

  output.value = JSON.stringify(outline);
};
