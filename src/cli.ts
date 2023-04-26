#!/usr/bin/env node

import { Command } from 'commander';
import { prompt } from 'enquirer';
import fs from "fs";
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { getAsset } from './lib/sdk';
import { Args } from './types';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const pkgVersion = pkg.version

const program = new Command();

program 
    .description('A tool for creating and retrieving information about an Evolutionary App')
    .version(pkgVersion, '-v, --version', 'Gets the current version number of the cli')

program
  .command('create <folder>')
  .description('Create an evolutionary app')
  .option('-w, --wallet <string>', 'Path to your keyfile')
  .option('-t, --title <string>', `Title of application (Max. 80 characters)`)
  .option('-d, --description <string>', `Description of your app (Max. 300 characters)`)
  .option('-f, --forks <string>', 'Transaction ID of the app that is being forked')
  .option('-b, --balance <number>', 'Number of tokens you wish to mint for your work')
  .option('-i, --index-file <string>', `Name of the file to use as an index for manifests (relative to the folder path provided)`)
  .option('--release-notes <string>', 'Path to release notes')
  .option('--no-confirmation', 'Skip confirmation step for certain actions')
  .option('--groupId <string>', 'Set a unique identifier for your app (Only applies to base versions.)')
  .option('--host <string>', 'Bundlr node hostname/URL (e.g. http://node2.bundlr.network)')
  .option('--topics <string>', 'A list of comma-seperated topics (e.g. react,todo,warp)')
  .option('--debug', 'Increase verbosity of logs and errors')
  .action(async (folder: string, options) => {
    const { wallet, title, description, forks, balance, groupId, host, topics } = options;

    if (folder) {
        console.log(folder);
    }
    
    for (const key in options) {
        if (key) {
            console.log(options[key])
        }
    }
  });

program
  .command('get <id>')
  .description('Get info about an evolutionary app')
  .option('-w, --wallet <string>', 'Path to your keyfile')
  .option('--debug', 'Increase verbosity of logs and errors')
  .action(async (id :string, options) => {

    const requiredArgs: Pick<Args, 'wallet'> = {
        wallet: ''
    }

    if (options.wallet) {
        requiredArgs.wallet = options.wallet;
    } else {
        const response: { wallet: string } = await prompt([
            {
              type: 'input',
              name: 'wallet',
              message: 'Please provide a path to your Arweave wallet keyfile',
              required: true,
            },
          ])
    
          if (response.wallet) {
            requiredArgs.wallet = response.wallet;
          } else {
            console.error('No Wallet path provided');
            return;
          }
    }

    if (id.length !== 43) {
        console.error(chalk.red('Error: The provided ID must be 43 characters in length'))
        return;
    }

    let spinner: Ora = ora();

    try {
        if (options.debug) {
            spinner.start()
            spinner.text =   `Fetching information for app with ID: ${id}`
        }

        const res = await getAsset({ id, wallet: requiredArgs.wallet })
        if (options.debug) {
            spinner.succeed(`App found with following info:`)
            console.log(res)
        } else {
            console.log(res)
        }
    } catch (error: any) {
        if (options.debug) {
            spinner.color = 'red'
            spinner.fail(`Error occured whilst fetching data: ${options.debug ? error.stack : error.message}`)
        } else {
            console.error(chalk.red(`Error occured whilst fetching data: ${options.debug ? error.stack : error.message}`));
        }
        return;
    }

  });

program.parse(process.argv);
