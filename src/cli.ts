#!/usr/bin/env node

import { Command } from 'commander';
import { prompt } from 'enquirer';
import fs, { readFileSync } from "fs";
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { getAsset } from './lib/sdk';
import { Args } from './types';
import { print } from './utils/print';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const pkgVersion = pkg.version

const program = new Command();

program 
    .description('A tool for creating and retrieving information about an Evolutionary App')
    .version(pkgVersion, '-v, --version', 'Gets the current version number of the cli')

program
  .command('create <folder> <type>')
  .description('Create an evolutionary app')
  .option('-w, --wallet <string>', 'Path to your keyfile')
  .option('-t, --title <string>', `Title of application (Max. 80 characters)`)
  .option('-d, --description <string>', `Description of your app (Max. 300 characters)`)
  .option('-f, --forks <string>', 'Transaction ID of the app that is being forked')
  .option('-b, --balance <number>', 'Number of tokens you wish to mint for your work')
  .option('-i, --index-file <string>', `Name of the file to use as an index for manifests (relative to the folder path provided)`)
  .option('--release-notes <string>', 'Path to release notes')
  .option('--no-confirmation', 'Skip confirmation step for certain actions')
  .option('--no-optional', 'Skip prompts for optional fields')
  .option('--groupId <string>', 'Set a unique identifier for your app (Only applies to base versions.)')
  .option('--host <string>', 'Bundlr node hostname/URL (e.g. http://node2.bundlr.network)')
  .option('--topics <string>', 'A list of comma-seperated topics (e.g. react,todo,warp)')
  .option('--debug', 'Increase verbosity of logs and errors')
  .action(async (folder: string, type: 'base' | 'fork', options) => {
    

    if (type !== 'base' && type !== 'fork') {
        console.error(chalk.red('Error: You can only specify an application as a base or fork'));
        return;
    }
    
    for (const key in options) {
        switch (key) {
            case 'wallet':
                try {
                    readFileSync(options.wallet, 'utf-8')
                } catch (error: any) {
                    print.warn(`• "wallet" ${error.message}`)
                    options.wallet = null
                }
                break;
            case 'title':
                if (options.title.length > 80) {
                    print.warn('• "title" Too long. Must be a maximum of 80 characters.')
                    options.title = null
                }
                if (options.title.length < 2) {
                    print.warn('• "title" Too short. Must be at least 2 characters.')
                    options.title = null
                }
                break;
            case 'description':
                if (options.description.length > 300) {
                    print.warn('• Too long. Must be a maximum of 300 characters.')
                    options.description = null
                }
                if (options.description.length < 8) {
                    print.warn('• Too short. Must be at least 8 characters.')
                    options.description = null
                }
                break;
            case 'balance':
                if (isNaN(options.balance)) {
                    print.warn('• "balance" Must be a number')
                    options.balance = null
                } else {
                    const bal = typeof options.balance === 'number' ? options.balance : Number(options.balance)
                    if (!Number.isInteger(bal)) {
                        print.warn('• "balance" Balance must be an integer')
                        options.balance = null
                    }
                }
                break;
            case 'groupId':
                if (options.groupId.length > 80) {
                    print.warn('• "groupId" Too long. Must be a maximum of 80 characters.')
                    options.groupId = null
                }
                if (options.groupId.length < 2) {
                    print.warn('• "groupId" Too short. Must be at least 2 characters.')
                    options.groupId = null
                }
                break;
            case 'forks':
                if (options.forks.length !== 43) {
                    print.warn('• "forks" Must be a Transaction ID (43 characters).')
                    options.forks = null
                }
                break;
            case 'host':
                if (options.host !== 'https://node1.bundlr.network' && options.host !== 'https://node2.bundlr.network') {
                    print.warn('• "host" Must be a valid bundlr node (e.g. https://node2.bundlr.network).')
                    options.host = null
                }
                break;
                case 'releaseNotes':
                    try {
                        readFileSync(options.releaseNotes, 'utf-8')
                    } catch (error: any) {
                        print.warn(`• "release-notes" ${error.message}`)
                        options.releaseNotes = null
                    }
                    break;
            default:
                break;
        }
    }
    
    if (!options.wallet) {
        await prompt([
            {
                name: 'wallet',
                message: 'Provide a path to your keyfile',
                type: 'input',
                required: true,
            }
        ])
        .then((answers: any) => {
            options.wallet = answers.wallet
        })
    } 

    if (!options.title) {
        await prompt([
            {
                name: 'title',
                message: 'Provide a title for your app',
                type: 'input',
                hint: 'Max. 80 Characters',
                required: true,
                validate: (value: string) => {
                    if (value.length < 2) {
                        return 'Title is too short'
                    } 
                    if (value.length > 80) {
                        return 'Title is too long'
                    } 
                    return true;
                },
            }
        ])
        .then((answers: any) => {
            options.title = answers.title
        })
    } 

    if (!options.description) {
        await prompt([
            {
                name: 'description',
                message: 'Provide a description for your app',
                type: 'input',
                hint: 'Max. 300 Characters',
                required: true,
                validate: (value: string) => {
                    if (value.length < 8) {
                        return 'Description is too short'
                    } 
                    if (value.length > 300) {
                        return 'Description is too long'
                    } 
                    return true;
                },
            }
        ])
        .then((answers: any) => {
            options.description = answers.description
        })
    } 

    if (!options.groupId && type !== 'fork') {
        await prompt([
            {
                name: 'groupId',
                message: 'Provide an optional groupId for your app',
                type: 'input',
                validate: (value: string) => {
                    if (value.length < 2) {
                        return 'Group ID is too short'
                    } 
                    if (value.length > 80) {
                        return 'Group ID is too long'
                    } 
                    return true;
                },
            }
        ])
        .then((answers: any) => {
            options.groupId = answers.groupId
        })
    } 

    if (!options.topics) {
        await prompt([
            {
                name: 'topics',
                message: 'Provide a list of comma-separated topics',
                type: 'input',
                required: true,
            }
        ])
        .then((answers: any) => {
            options.topics = answers.topics
        })
    } 

    if (!options.forks && type === 'fork') {
        await prompt([
            {
                name: 'forks',
                message: 'Provide a transaction ID for the app you are remixing',
                type: 'input',
                required: type === 'fork',
                validate: (value: string) => {
                    if (value.length !== 43) {
                        return 'Transaction ID must be 43 characters.'
                    }
                    return true
                }
            }
        ])
        .then((answers: any) => {
            options.forks = answers.forks
        })
    } 

    if (!options.balance) {
        await prompt([
            {
                name: 'balance',
                message: 'Set the number of tokens you wish to mint.',
                hint: 'Must be an integer',
                type: 'numeral',
                required: true,
                validate: (value: string) => {
                    if (!Number.isInteger(value)) {
                        return 'Balance must be an integer'
                    }
                    return true;
                }
            }
        ])
        .then((answers: any) => {
            options.balance = answers.balance
        })
    }

    if (!options.releaseNotes) {
        await prompt([
            {
                name: 'releaseNotes',
                message: 'Provide a path to your release notes.',
                type: 'input',
                required: true,
            }
        ])
        .then((answers: any) => {
            options.releaseNotes = answers.releaseNotes
        })
    } 

    if (!options.host && !options.noOptional) {
        await prompt([
        {
            name: 'host',
            message: 'Choose a preferred host for bundlr',
            type: 'select',
            choices: [
                'https://node1.bundlr.network',
                'https://node2.bundlr.network'
            ],
            required: true
        }
        ])
        .then((answers: any) => {
            options.host = answers.host
        })
    } 

    if (!options.index && !options.noOptional) {
        await prompt([
        {
            name: 'index',
            message: 'Provide an index file for your manifest',
            type: 'input',
            initial: 'index.html',
        }
        ])
        .then((answers: any) => {
            options.index = answers.index
        })
    } 
        
    // console.log(options);
        

    // create manifest (include step to ask if user already has manifest file/config)
    
    // confirmation flow
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
