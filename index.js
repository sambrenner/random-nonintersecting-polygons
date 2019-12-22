import { SVG } from '@svgdotjs/svg.js';
import hull from 'hull.js';
import { Noise } from 'noisejs';
import simplify from 'simplify-js';

let draw;
let output;
let seedOutput;
let noise;
let config = {};

document.addEventListener('DOMContentLoaded', () => {
  draw = new SVG()
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
    const val = getValue(input);
    config[input.dataset.controls] = val;
    updateLabel(input, val);

    input.addEventListener('input', e => {
      const key = e.target.dataset.controls;
      const val = getValue(e.target);

      config[key] = val;

      updateLabel(e.target, val);

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
      let val = Math.abs(noise.simplex2(
        x / config.resolution,
        y / config.resolution
      ));

      let vIntensity = 1000 - config.vignette;

      if (vIntensity) {
        const vignette = 1 - (Math.hypot(50 - x, 50 - y) / vIntensity);
        val *= vignette;
      }

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

  if (config.simplify) {
    outline = simplify(
      outline.map(p => ({x: p[0], y: p[1]})),
      config.simplify
    ).map(p => [p.x, p.y]);
  }

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

const getValue = elem => {
  return elem.type === 'checkbox'
    ? elem.checked
    : parseFloat(elem.value);
}

const updateLabel = (elem, val) => {
  if (elem.type !== 'range') return;

  const label = elem.parentElement;
  label.querySelector('.val').innerText = val;
}
