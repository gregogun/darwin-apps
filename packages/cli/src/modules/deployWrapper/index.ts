import fs from 'fs';
import path from 'path';
import Bundlr from '@bundlr-network/client';
import { htmlContent, jsContent, packageJsonContent, viteConfigContent } from './templates';
import { spawnSync } from 'child_process';

interface AppInfo {
  title: string;
  description: string;
  baseId: string;
}

const deployWrapper = async (
  id: string,
  wallet: string,
  appInfo: AppInfo,
  host?: string,
  debug?: boolean
) => {
  if (!id) {
    throw new Error('Asset ID must be provided.');
  }

  const keyfile = JSON.parse(fs.readFileSync(wallet, 'utf-8'));
  // init bundlr
  const bundlr = new Bundlr(host ? host : 'https://node2.bundlr.network', 'arweave', keyfile);

  let wrapperId: string | undefined;

  try {
    // create vite project
    const wrapperDir = 'app-wrapper';
    const projectPath = path.resolve(path.join(__dirname, wrapperDir));

    runCommandSync(`pnpm create vite ${wrapperDir} --template vanilla`, { cwd: __dirname, debug });
    const indexPath = path.join(projectPath, 'index.html');
    const mainPath = path.join(projectPath, 'main.js');
    const counterPath = path.join(projectPath, 'counter.js');
    const stylePath = path.join(projectPath, 'style.css');
    const packageJsonPath = path.join(projectPath, 'package.json');
    const viteConfigPath = path.join(projectPath, 'vite.config.js');

    fs.writeFileSync(packageJsonPath, packageJsonContent);
    fs.writeFileSync(viteConfigPath, viteConfigContent);

    runCommandSync('pnpm install', { cwd: projectPath, debug });

    // remove counter.js and style.css
    fs.unlinkSync(counterPath);
    fs.unlinkSync(stylePath);

    // replace default html content with our own
    fs.writeFileSync(indexPath, htmlContent);
    // replace default js content with our own
    fs.writeFileSync(mainPath, jsContent);

    const originalMain = fs.readFileSync(mainPath, 'utf-8');
    const lines = originalMain.split('\n');

    const updatedLines = lines.map((line) => {
      if (line.includes('let txid;')) {
        return `let txid = '${id}';`;
      }
      return line;
    });

    const updatedMain = updatedLines.join('\n');
    fs.writeFileSync(mainPath, updatedMain, 'utf-8');

    runCommandSync('pnpm build', { cwd: projectPath, debug });

    const tags = [
      { name: 'Data-Protocol', value: 'Evoapps' },
      { name: 'Type', value: 'app-wrapper' },
      { name: 'Title', value: appInfo.title },
      { name: 'Description', value: appInfo.description },
      { name: 'Base', value: appInfo.baseId },
      { name: 'Published', value: Date.now().toString() },
    ];

    // deploy
    await bundlr
      .uploadFolder(path.join(projectPath, 'dist'), {
        indexFile: 'index.html',
        manifestTags: tags,
      })
      .then((res) => {
        wrapperId = res?.id;
        // cleanup/remove generated directory
        fs.rmSync(projectPath, { recursive: true });
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    throw new Error(error as any);
  }

  return wrapperId;
};

interface CommandOptions {
  cwd?: string;
  debug?: boolean;
}

function runCommandSync(command: string, options?: CommandOptions) {
  const [cmd, ...args] = command.split(' ');
  const result = spawnSync(cmd, args, { ...options, stdio: options?.debug ? 'inherit' : 'ignore' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command exited with status code ${result.status}`);
  }
}

export default deployWrapper;
