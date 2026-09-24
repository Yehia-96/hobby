// Compiles MindAR image targets (targets/cards.mind) in Node on the CPU. MindAR's own
// browser compiler needs WebGL and its offline one needs node-canvas, which won't build here,
// so this feeds decoded JPEG pixels straight into its CompilerBase.
// Run: npm run compile-targets   (after npm install --ignore-scripts)
import { readFile, writeFile } from 'node:fs/promises';
import jpeg from 'jpeg-js';
import * as tf from '@tensorflow/tfjs';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

class NodeCompiler extends CompilerBase {
  // CompilerBase only draws the image and reads its pixels back, so a stand-in is enough.
  createProcessCanvas(img) {
    return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: img.rgba }) }) };
  }
  compileTrack({ progressCallback, targetImages, basePercent }) {
    const per = (100 - basePercent) / targetImages.length;
    let percent = 0;
    return Promise.resolve(targetImages.map((target) => {
      const list = buildTrackingImageList(target);
      return extractTrackingFeatures(list, () => { percent += per / list.length; progressCallback(basePercent + percent); });
    }));
  }
}

const [out, ...files] = process.argv.slice(2);
if (!out || files.length === 0) {
  console.error("usage: node tools/compile-targets.mjs <out.mind> <card1.jpg> [card2.jpg ...]");
  process.exit(1);
}
await tf.setBackend('cpu');
const images = await Promise.all(files.map(async (f) => {
  const { width, height, data } = jpeg.decode(await readFile(f), { useTArray: true });
  return { width, height, rgba: data };
}));
const compiler = new NodeCompiler();
let last = -1;
await compiler.compileImageTargets(images, (p) => { if (Math.floor(p / 10) > last) { last = Math.floor(p / 10); console.log(`${p.toFixed(0)}%`); } });
const buffer = compiler.exportData();
await writeFile(out, buffer);
console.log(`wrote ${buffer.byteLength} bytes to ${out}`);
