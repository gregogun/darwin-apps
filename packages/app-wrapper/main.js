import './style.css';
import graph from '@permaweb/asset-graph';
import Stamps from '@permaweb/stampjs';
import { WarpFactory, LoggerFactory } from 'warp-contracts';

const warp = WarpFactory.forMainnet();
LoggerFactory.INST.logLevel('none');

const stamps = Stamps.init({ warp });

let delayTimer;

let txid;

async function calculateStamps(txid) {
  // use txid in getGraph function to get all versions
  const res = await graph('fmUsilSMxoVFWqsjBySYFHKksOrp25lRFmzerWx8EQY');
  console.log('res', res);

  // transform to flattened array
  const ids = flattenTree(res);
  console.log('ids', ids);
  // pass array of tx's to stamp function
  const counts = await stamps.counts(ids);
  // calculate most stamped
  const result = getKeyWithHighestVouched(counts);
  console.log('reult', result);
  location.href = `https://g8way.io/${result}`;
  // append to g8way.io url and use in replaceUrl method
}

function delayReplaceUrl() {
  delayTimer = setTimeout(replaceUrl, 2000); // delay for 2 seconds
}

function replaceUrl() {
  window.location.replace('https://g8way.io/IfiPQii_m15ihtQzWZBZUs-QaQG_I4xnGwNpPVleY4c');
}

function keyPressHandler(event) {
  if (event.keyCode === 27) {
    // 27 is the code for the escape key
    clearTimeout(delayTimer); // cancel the delay
    window.location.replace('https://g8way.io/JomdCqBvBJWq6MQeeTmEcfKBfxKvRm_VTHofEPUJZ0c/'); // navigate to the specified URL
  }
}

function flattenTree(tree) {
  const result = [];

  function traverse(node) {
    result.push(node.id);
    if (node.children) {
      node.children.forEach((child) => traverse(child));
    }
  }

  traverse(tree);

  return result;
}

function getKeyWithHighestVouched(obj) {
  const vouchedArr = Object.values(obj).map((item) => item.vouched);
  const sortedArr = vouchedArr.sort((a, b) => b - a);
  const highestVouched = sortedArr[0];

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key].vouched === highestVouched) {
      return key;
    }
  }
}

window.addEventListener('load', calculateStamps);
window.addEventListener('keydown', keyPressHandler);
