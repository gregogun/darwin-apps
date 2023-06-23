export const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App Wrapper</title>
    <style>
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;

      color-scheme: light dark;
      color: rgba(255, 255, 255, 0.87);
      background-color: hsl(200, 7%, 8.8%);

      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
    }

    svg {
      position: absolute;
      top: 50%;
      left: 50%;
    }

    .path {
      animation: dash 1.75s linear infinite;
      stroke-linecap: round;
    }

    @keyframes dash {
      0% {
        stroke-dasharray: 0, 158;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 79, 158;
        stroke-dashoffset: -30px;
      }
      100% {
        stroke-dasharray: 0, 158;
        stroke-dashoffset: -158px;
      }
    }
  </style>
  </head>
  <body>
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewbox="0 0 59.072 26.388">
      <defs>
        <style>
          .path {
            fill: none;
            stroke: hsl(226, 70%, 55.5%);
            stroke-miterlimit: 10;
            stroke-width: 2.5px;
          }
        </style>
      </defs>
      <path
        class="path"
        d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z"
        transform="translate(-268.104 -242.681)"
      />
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewbox="0 0 59.072 26.388">
      <defs>
        <style>
          .a {
            fill: none;
            stroke: hsl(226, 70%, 55.5%);
            stroke-miterlimit: 10;
            stroke-width: 1.75px;
            opacity: 0.3;
          }
        </style>
      </defs>
      <path
        class="a"
        d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z"
        transform="translate(-268.104 -242.681)"
      />
    </svg>
    <div id="app"></div>
    <script>
    if (typeof global === 'undefined') {
      window.global = window;
      global.crypto = window.crypto;
      global.msCrypto = window.msCrypto;
    }
  </script>
    <script type="module" src="/main.js"></script>
  </body>
</html>
`;

export const jsContent = `
import graph from '@permaweb/asset-graph';
import Stamps from '@permaweb/stampjs';
import { WarpFactory, LoggerFactory } from 'warp-contracts';
import Arweave from 'arweave'

const arweave = Arweave.init({})

const warp = WarpFactory.forMainnet();
LoggerFactory.INST.logLevel('none');

const stamps = Stamps.init({ warp });

let txid;

let wrapperTx;

async function getWrapperTx(txid) {
  console.log('txid', txid)
  const queryObj = {
    query: \` query ($txid: String!) {
            transactions(
                tags: [
                        { 
                            name: "Content-Type", 
                            values: ["application/x.arweave-manifest+json"]
                        },
                        { 
                            name: "Data-Protocol", 
                            values: ["Evoapps"]
                        },
                        {
                            name: "Wrapper-For", 
                            values: [$txid]
                        }
                ]
            )
            {
			edges {
				node {
					id
					tags {
						name
						value
					}
				}
			}
		}
        }\`,
        variables: {
          txid: txid
        }
  };

  const res = await arweave.api.post("/graphql", queryObj);
  const metadata = res.data.data.transactions.edges.map((edge) => edge.node.id)
  console.log('metadata', metadata)
  const tx = metadata.reverse()[0]
  console.log('tx', tx)
  return tx;
}

async function calculateStamps(txid) {
  // use txid in getGraph function to get all versions
  const res = await graph(txid);
  console.log('res', res);

  // transform to flattened array
  const ids = flattenTree(res);
  console.log('ids', ids);
  // pass array of tx's to stamp function
  const counts = await stamps.counts(ids);
  console.log('counts', ids);
  // calculate most stamped
  const result = getKeyWithHighestVouched(counts);
  console.log('result', result);
  const target = result ? result : txid;

  setTimeout(() => {
    location.href = 'https://g8way.io/' + target;
  }, 1000); // delay for 1 second after computation
}

function keyPressHandler(event) {
  if (event.keyCode === 27) {
    if (wrapperTx) {    
      // 27 is the code for the escape key
      window.location.replace('https://evolutionary.g8way.io/#/app?tx=' + wrapperTx + '&baseId=' + txid); // navigate to the specified URL
    } else {
      window.location.replace('https://evolutionary.g8way.io/'); // navigate to the specified URL
    }
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
    const keys = Object.keys(obj);
    const vouchedArr = keys.map((key) => obj[key].vouched);
    const sortedArr = vouchedArr.sort((a, b) => b - a);
    const highestVouched = sortedArr[0];
  
    // If the highest vouched value is 0, return the first key in the object.
    if (highestVouched === 0) {
      return keys[0];
    }
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key].vouched === highestVouched) {
        return key;
      }
    }
  }

window.addEventListener('load', async () => {
  console.log('load running...')
  try {
    const tx = await getWrapperTx(txid)
    wrapperTx = tx;
    await calculateStamps(txid)
  } catch (error) {
    console.error(error)
  }
}); 
window.addEventListener('keydown', keyPressHandler);
`;

export const packageJsonContent = `{
    "name": "evolutionary-app-wrapper",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "pnpm clean-build && vite build",
      "clean-build": "rm -rf dist",
      "preview": "vite preview",
      "prepublishOnly": "npm run build"
    },
    "dependencies": {
      "@permaweb/asset-graph": "https://arweave.net/-jYaU7HYX3JNpsOTqkMzEKUK4_5Mfy-a88jtgSNrI_k",
      "@permaweb/stampjs": "0.0.15",
      "arweave": "1.12.4",
      "warp-contracts": "1.2.39"
    },
    "devDependencies": {
      "vite": "^4.3.2"
    },
    "homepage": "."
  }`;

export const viteConfigContent = `
  import { defineConfig } from 'vite';
  
  export default defineConfig({
    base: ''
  });
  `;
