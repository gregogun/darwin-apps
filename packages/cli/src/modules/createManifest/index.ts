import { Manifest } from '../../types';
import fs from 'fs';
import Bundlr from '@bundlr-network/client';
import { confirmation, formatBytes, print, sleep } from '../../utils';
import { recursiveReadDir } from './recursiveReadDir';
import { recursiveUploadFiles } from './recursiveUpload';
import ora, { Ora } from 'ora';

export const createManifest = async (
  folder: string,
  wallet: string,
  manifest: Manifest,
  host: string | undefined,
  debug: boolean
) => {
  let keyfile = '';

  try {
    keyfile = JSON.parse(fs.readFileSync(wallet, 'utf-8'));
  } catch (error) {
    throw new Error('Invalid path to wallet address');
  }

  // init bundlr
  const bundlr = new Bundlr(host ? host : 'https://node2.bundlr.network', 'arweave', keyfile);

  try {
    // get file names and sizes
    const files = await recursiveReadDir(folder);

    let combinedSize = files.sizes.reduce((a, b) => a + b, 0);
    const priceWinston = await bundlr.getPrice(combinedSize);

    const priceAr = bundlr.utils.unitConverter(priceWinston);

    let spinner: Ora = ora();
    spinner.start();
    spinner.text = 'Calculating upload size and price...';

    await sleep();

    spinner.stop();

    await confirmation(
      `Authorize file upload?\n Total amount of data: ${combinedSize} bytes (${formatBytes(
        combinedSize
      )}) over ${
        files.sizes.length
      } files - cost = ${priceWinston} winston / ${priceAr.toFixed()} AR`
    ).then(async (confirm) => {
      if (confirm) {
        spinner.start();
        spinner.text = `Uploading ${files.names.length} files...`;
        await recursiveUploadFiles(folder, manifest.paths, bundlr).then(() => {
          spinner.succeed(`${files.sizes.length} files uploaded successfully ✨`);
        });

        // rename file names for manifest
        const dirNameLength = folder.length + 1; // +1 to include trailing slash
        for (const key in manifest.paths) {
          const removedDirName = key.substring(dirNameLength);
          manifest.paths[removedDirName] = manifest.paths[key];
          delete manifest.paths[key];
        }

        if (debug) {
          spinner.start();
          spinner.text = 'Creating backup manifest file...';
        }

        fs.writeFileSync(
          `${process.cwd()}/${folder}-manifest.json`,
          JSON.stringify(manifest, null, 2)
        );

        if (debug) {
          spinner.succeed(`Backup manifest file created.`);
        }
      } else {
        throw new Error('Upload process cancelled');
      }
    });
  } catch (error) {
    throw error;
  }

  return manifest;
};
