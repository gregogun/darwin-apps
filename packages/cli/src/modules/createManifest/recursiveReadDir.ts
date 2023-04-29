import fs from "fs";
import path from "path";

interface FileObject {
  names: string[];
  sizes: number[];
}

export const recursiveReadDir = async (dir: string): Promise<FileObject> => {
  const files = await fs.promises.readdir(dir);
  // process each file/directory in parallel
  const fileObjects = await Promise.all(
    files
      .filter((file) => !file.includes(".DS_Store"))
      .map(async (file) => {
        const filepath = path.join(dir, file);
        const stats = await fs.promises.stat(filepath);
        // if item is a directory, call function recursively and return result; otherwise, return the file path name and size
        if (stats.isDirectory()) {
          return recursiveReadDir(filepath);
        } else {
          return {
            names: [file],
            sizes: [stats.size],
          };
        }
      })
  );
  const { names, sizes } = fileObjects.reduce<FileObject>(
    (accumulator, fileObject) => {
      // concatenate the 'names' array of each file object to the accumulator's 'names' array
      accumulator.names.push(...fileObject.names);
      // concatenate the 'sizes' array of each file object to the accumulator's 'sizes' array
      accumulator.sizes.push(...fileObject.sizes);
      // return the updated accumulator
      return accumulator;
      // start with an empty 'names' array and an empty 'sizes' array
    },
    { names: [], sizes: [] }
  );
  return { names, sizes };
};
