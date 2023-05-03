import fs, { readFileSync } from 'fs';
import Bundlr from '@bundlr-network/client';
import AdmZip from 'adm-zip';
import path from 'path';
import { confirmation, formatBytes, sleep } from '../../utils';
import ora, { Ora } from 'ora';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const pkgName = pkg.name;
const pkgVersion = pkg.version;

export const deploySourceCode = async (
  wallet: string,
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

  const projectZip = `${pkgName}-${pkgVersion}.zip`;

  let spinner: Ora = ora();

  let ignoreList;
  try {
    ignoreList = readFileSync('.gitignore', 'utf8')
      .split('\n')
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    throw error;
  }

  const tempDir = `${pkgName}-${pkgVersion}`;
  ignoreList.push(tempDir, '.git');

  // prevent error by checking if already exists
  if (!fs.existsSync(tempDir)) {
    if (debug) {
      spinner.start();
      spinner.text = 'Creating temporary upload directory...';
    }
    fs.mkdirSync(tempDir);
  }

  if (debug) {
    spinner.text = 'Copying source code files and directories into temporary directory...';
  }
  // copy all files and directories not in ignore list into temp directory
  copyItems('./', tempDir, ignoreList);
  await sleep();
  if (debug) {
    spinner.text = 'Creating zip archive...';
  }
  await createZipArchive(tempDir);
  if (debug) {
    spinner.succeed('Zip successfully archive created');
  }

  let sourceCodeId;

  try {
    const uploadSize = fs.statSync(projectZip).size;

    const priceWinston = await bundlr.getPrice(uploadSize);

    const priceAr = bundlr.utils.unitConverter(priceWinston);

    spinner.start();
    spinner.text = 'Calculating source code size and price...';

    await sleep();

    spinner.stop();

    const confirmUpload = await confirmation(
      `Authorize file upload?\n Total amount of data: ${uploadSize} bytes (${formatBytes(
        uploadSize
      )}) - cost = ${priceWinston} winston / ${priceAr.toFixed()} AR`
    );

    if (confirmUpload) {
      spinner.start();
      spinner.text = `Uploading source code...`;
      await bundlr.uploadFile('./' + projectZip).then((res) => {
        spinner.succeed(`${projectZip} uploaded successfully \n Transaction ID: ${res.id} ✨`);
        sourceCodeId = res.id;
      });
    }

    const confirmCleanup = await confirmation(
      `Would you like to remove the files generated for deployment?`
    );

    if (confirmCleanup) {
      fs.rmSync(tempDir, { recursive: true });
      fs.rmSync(projectZip, { recursive: true });
    }
  } catch (error) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    throw error;
  }

  return sourceCodeId;
};

const createZipArchive = (tempDir) => {
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);
    zip.writeZip(`${tempDir}.zip`);
  } catch (error) {
    throw new Error(`Zip Archive couldn't be created: ${error}`);
  }
};

const copyItems = (src, dest, ignoreList) => {
  // check with file types so we can run method to check if item is directory
  let items = fs.readdirSync(src, { withFileTypes: true });
  items.forEach((item) => {
    if (!ignoreList.includes(item.name)) {
      const sourcePath = path.join(src, item.name);
      const destinationPath = path.join(dest, item.name);
      if (item.isDirectory()) {
        fs.mkdirSync(destinationPath);
        copyItems(sourcePath, destinationPath, ignoreList);
      } else {
        fs.copyFileSync(sourcePath, destinationPath);
      }
    }
  });
};
