import chalk from "chalk";
import fs from "fs";
import { prompt } from "enquirer";
import { arweave } from "../lib/arweave";

export const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

export const print = {
  error: (message: string | undefined) => console.log(chalk.red(message)),
  info: (message: string | undefined) => console.log(chalk.blue(message)),
  log: (message: string | undefined) => console.log(message),
  success: (message: string | undefined) => console.log(chalk.green(message)),
  warn: (message: string | undefined) => console.log(chalk.yellow(message)),
};

type Answer = {
  confirm: string;
};

export const confirmation = async (message: string) => {
  const answer: Answer = await prompt([
    {
      name: "confirm",
      message: message,
      type: "input",
      hint: "Y / N",
      validate: (value: string) => {
        const confirmRegex = /[NnYy]/g;
        if (value.match(confirmRegex)) {
          return true;
        } else {
          return 'Response must be either "Y" or "N"';
        }
      },
    },
  ]);

  if (answer.confirm.match(/[Yy]/g)) {
    return true;
  } else {
    return false;
  }
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else if (bytes < 1073741824) {
    return (bytes / 1048576).toFixed(2) + " MB";
  } else {
    return (bytes / 1073741824).toFixed(2) + " GB";
  }
};

export const jwkToAddress = async (walletPath: string): Promise<string> => {
  const jwk = JSON.parse(fs.readFileSync(walletPath, "utf8"));

  const address = await arweave.wallets.jwkToAddress(jwk);

  return address;
};
