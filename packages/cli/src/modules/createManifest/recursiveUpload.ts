import fs, { readFileSync, readdirSync } from 'fs';
import path from 'path';
import mime from 'mime-types';
import NodeBundlr from '@bundlr-network/client/build/cjs/node/bundlr';

export const recursiveUploadFiles = async (dir: string, paths: {}, bundlr: NodeBundlr) => {
  const files = readdirSync(dir);

  // loop through files and upload
  for (const file of files) {
    const filepath = path.join(dir, file);

    if (fs.statSync(filepath).isDirectory()) {
      await recursiveUploadFiles(filepath, paths, bundlr);
    } else {
      const contentType = mime.lookup(file) || 'text/plain';
      try {
        const data = readFileSync(filepath, 'utf-8');
        const tx = await bundlr.createTransaction(data, {
          tags: [{ name: 'Content-Type', value: contentType }],
        });
        await tx.sign();
        await tx.upload();
        paths[filepath] = { id: tx.id };
      } catch (error) {
        throw error;
      }
    }
  }
};
