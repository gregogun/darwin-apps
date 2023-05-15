import { Command } from 'commander';
import { prompt } from 'enquirer';
import fs, { readdirSync, readFileSync } from 'fs';
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { createAsset, getAsset } from './lib/sdk';
import { Args, Manifest } from './types';
import { confirmation, print, sleep } from './utils';
import { createManifest } from './modules/createManifest';
import { deploySourceCode } from './modules/deploySourceCode';
import deployWrapper from './modules/deployWrapper';

const program = new Command();

program
  .description('A tool for creating and retrieving information about an Evolutionary App')
  .version('0.0.3', '-v, --version', 'Gets the current version number of the cli');

program
  .command('create <folder> <type>')
  .description('Create an evolutionary app')
  .option('-w, --wallet <string>', 'Path to your keyfile')
  .option('-t, --title <string>', `Title of application (Max. 80 characters)`)
  .option('-d, --description <string>', `Description of your app (Max. 300 characters)`)
  .option('-f, --forks <string>', 'Transaction ID of the app that is being forked')
  .option('-b, --balance <number>', 'Number of tokens you wish to mint for your work')
  .option('-s, --source-code <string>', 'Transaction ID of the source code for your app')
  .option(
    '-i, --index-file <string>',
    `Name of the file to use as an index for manifests (relative to the folder path provided)`
  )
  .option('--release-notes <string>', 'Path to release notes')
  .option('--skip-confirmation', 'Skip confirmation step for certain actions')
  .option('--skip-optional', 'Skip prompts for optional fields')
  .option(
    '--groupId <string>',
    'Set a unique identifier for your app (Only applies to base versions.)'
  )
  .option('--host <string>', 'Bundlr node hostname/URL (e.g. http://node2.bundlr.network)')
  .option('--topics <string>', 'A list of comma-seperated topics (e.g. react,todo,warp)')
  .option('--debug', 'Increase verbosity of logs and errors')
  .action(async (folder: string, type: 'base' | 'fork', options) => {
    if (type !== 'base' && type !== 'fork') {
      console.error(chalk.red('Error: You can only specify an application as a base or fork'));
      return;
    }

    try {
      readdirSync(folder, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        print.error(`• ${options.debug ? error.stack : error.message}`);
      } else {
        print.error(`• ${error as string}`);
      }
      return;
    }

    for (const key in options) {
      switch (key) {
        case 'wallet':
          try {
            readFileSync(options.wallet, 'utf-8');
          } catch (error: any) {
            print.warn(`• "wallet" ${error.message}`);
            options.wallet = null;
          }
          break;
        case 'title':
          if (options.title.length > 80) {
            print.warn('• "title" Too long. Must be a maximum of 80 characters.');
            options.title = null;
          }
          if (options.title.length < 2) {
            print.warn('• "title" Too short. Must be at least 2 characters.');
            options.title = null;
          }
          break;
        case 'description':
          if (options.description.length > 300) {
            print.warn('• Too long. Must be a maximum of 300 characters.');
            options.description = null;
          }
          if (options.description.length < 8) {
            print.warn('• Too short. Must be at least 8 characters.');
            options.description = null;
          }
          break;
        case 'balance':
          if (isNaN(options.balance)) {
            print.warn('• "balance" Must be a number');
            options.balance = null;
          } else {
            const bal =
              typeof options.balance === 'number' ? options.balance : Number(options.balance);
            if (!Number.isInteger(bal)) {
              print.warn('• "balance" Balance must be an integer');
              options.balance = null;
            }
          }
          break;
        case 'groupId':
          if (options.groupId.length > 80) {
            print.warn('• "groupId" Too long. Must be a maximum of 80 characters.');
            options.groupId = null;
          }
          if (options.groupId.length < 2) {
            print.warn('• "groupId" Too short. Must be at least 2 characters.');
            options.groupId = null;
          }
          if (options.groupId && type === 'fork') {
            options.groupId = null;
          }
          break;
        case 'forks':
          if (options.forks.length !== 43) {
            print.warn('• "forks" Must be a Transaction ID (43 characters).');
            options.forks = null;
          }
          break;
        case 'sourceCode':
          if (options.sourceCode.length !== 43) {
            print.warn('• "forks" Must be a Transaction ID (43 characters).');
            options.forks = null;
          }
          break;
        case 'host':
          if (
            options.host !== 'https://node1.bundlr.network' &&
            options.host !== 'https://node2.bundlr.network'
          ) {
            print.warn('• "host" Must be a valid bundlr node (e.g. https://node2.bundlr.network).');
            options.host = null;
          }
          break;
        case 'releaseNotes':
          try {
            options.releaseNotes = readFileSync(options.releaseNotes, 'utf-8');
          } catch (error: any) {
            print.warn(`• "release-notes" ${error.message}`);
            options.releaseNotes = null;
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
        },
      ]).then((answers: any) => {
        options.wallet = answers.wallet;
      });
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
              return 'Title is too short';
            }
            if (value.length > 80) {
              return 'Title is too long';
            }
            return true;
          },
        },
      ]).then((answers: any) => {
        options.title = answers.title;
      });
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
              return 'Description is too short';
            }
            if (value.length > 300) {
              return 'Description is too long';
            }
            return true;
          },
        },
      ]).then((answers: any) => {
        options.description = answers.description;
      });
    }

    if (!options.groupId && type === 'base') {
      await prompt([
        {
          name: 'groupId',
          message: 'Provide an optional groupId for your app',
          type: 'input',
          validate: (value: string) => {
            if (value.length < 2) {
              return 'Group ID is too short';
            }
            if (value.length > 80) {
              return 'Group ID is too long';
            }
            return true;
          },
        },
      ]).then((answers: any) => {
        options.groupId = answers.groupId;
      });
    }

    if (!options.topics) {
      await prompt([
        {
          name: 'topics',
          message: 'Provide a list of comma-separated topics',
          type: 'input',
          required: true,
        },
      ]).then((answers: any) => {
        options.topics = answers.topics;
      });
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
              return 'Transaction ID must be 43 characters.';
            }
            return true;
          },
        },
      ]).then((answers: any) => {
        options.forks = answers.forks;
      });
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
              return 'Balance must be an integer';
            }
            return true;
          },
        },
      ]).then((answers: any) => {
        options.balance = answers.balance;
      });
    }

    if (!options.releaseNotes) {
      await prompt([
        {
          name: 'releaseNotes',
          message: 'Provide a path to your release notes.',
          type: 'input',
          required: true,
        },
      ]).then((answers: any) => {
        options.releaseNotes = answers.releaseNotes;
      });
    }

    if (!options.host && !options.skipOptional) {
      await prompt([
        {
          name: 'host',
          message: 'Choose a preferred host for bundlr',
          type: 'select',
          choices: ['https://node1.bundlr.network', 'https://node2.bundlr.network'],
        },
      ]).then((answers: any) => {
        options.host = answers.host;
      });
    }

    if (!options.index && !options.skipOptional) {
      await prompt([
        {
          name: 'index',
          message: 'Provide an index file for your manifest',
          type: 'input',
          initial: 'index.html',
        },
      ]).then((answers: any) => {
        options.index = answers.index;
      });
    }

    // prompt and deploy source code if no id given
    if (!options.sourceCode) {
      const confirmSource = await confirmation(
        'Do you have a Transaction ID for your source code?'
      );

      if (confirmSource) {
        await prompt([
          {
            name: 'sourceCode',
            message: 'Provide a transaction ID for your app source code',
            type: 'input',
            validate: (value: string) => {
              if (value.length !== 43) {
                return 'Transaction ID must be 43 characters.';
              }
              return true;
            },
          },
        ]).then((answers: any) => {
          options.sourceCode = answers.sourceCode;
        });
      } else {
        try {
          const sourceId = await deploySourceCode(options.wallet, options.host, options.debug);
          options.sourceCode = sourceId;
        } catch (error) {
          if (error instanceof Error) {
            print.error(options.debug ? error.stack : error.message);
          } else {
            print.error(error as any);
          }
        }
      }
    }

    // create manifest (include step to ask if user already has manifest file/config)
    let manifest: Manifest = {
      manifest: 'arweave/paths',
      version: '0.1.0',
      index: {
        path: options.index || 'index.html',
      },
      paths: {},
    };

    let manifestErr = false;

    const confirmDeploy = await confirmation(
      'Do you already have a manifest file you would like to deploy?'
      // { skip: options.skipOptional }
    );

    if (confirmDeploy) {
      await prompt([
        {
          name: 'manifest',
          message: 'Please provide a path to the file containing your manifest.',
          type: 'input',
          initial: `${folder}-manifest.json`,
          validate: (input) => {
            if (input.includes('json')) {
              return true;
            } else {
              return 'Must be a file of type json.';
            }
          },
        },
      ])
        .then((answer: any) => {
          const manifestFile = readFileSync(answer.manifest, 'utf-8');
          manifest = JSON.parse(manifestFile.toString());
        })
        .catch((error) => {
          if (error instanceof Error) {
            print.error(options.debug ? error.stack : error.message);
          } else {
            print.error(error as any);
          }
          manifestErr = true;
          return;
        });
    } else {
      try {
        manifest = await createManifest(
          folder,
          options.wallet,
          manifest,
          options.host,
          options.debug
        );
      } catch (error) {
        if (error instanceof Error) {
          print.error(options.debug ? error.stack : error.message);
        } else {
          print.error(error as any);
        }
        manifestErr = true;
      }
      if (manifestErr) {
        return;
      }
    }

    const requiredOps = options;
    // delete default ops from commander so we can pass into createAsset function
    delete requiredOps.confirmation;
    delete requiredOps.optional;

    if (type === 'fork') {
      let spinner: Ora = ora();

      if (options.debug) {
        spinner.start();
        spinner.text = 'Getting info about forked version...';
      }
      let fetchErr = false;
      await getAsset({
        id: options.forks,
        wallet: options.wallet,
      })
        .then((res) => {
          if (options.debug) {
            spinner.succeed('Forked version found. groupId set.');
          }
          options.groupId = res.groupId;
        })
        .catch(() => {
          if (options.debug) {
            spinner.fail(`Error: Unable to find the version you are forking from.`);
          }
          fetchErr = true;
        });
      if (fetchErr) {
        return;
      }
    }

    // confirmation flow
    const confirmCreate = await confirmation(
      `
    Would you like to confirm the following changes?: 
    \n ${chalk.blue(JSON.stringify(requiredOps, null, 2))}
    `,
      {
        skip: options.skipConfirmation,
      }
    );

    let createErr = false;

    if (confirmCreate) {
      let spinner: Ora = ora();
      let wrapperSpinner = ora();
      try {
        spinner.start();
        spinner.text = 'Deploying your app...';
        await createAsset(
          {
            groupId: options.groupId,
            title: options.title,
            description: options.description,
            topics: options.topics,
            forks: options.forks,
            wallet: options.wallet,
            balance: options.balance,
            releaseNotes: options.releaseNotes,
            sourceCode: options.sourceCode,
          },
          manifest,
          options.forks,
          options.host,
          options.debug,
          spinner
        )
          .then(async (res) => {
            if (!spinner.isSpinning) {
              spinner.start();
            }
            spinner.succeed(
              chalk.green(
                `You've successfully deployed your evolutionary app! 🚀 Transaction ID: ${res.id}`
              )
            );
            print.log(`Visit your deployment at: https://g8way.io/${res.id}`);

            if (type === 'base') {
              wrapperSpinner.start();
              wrapperSpinner.text = 'Deploying app wrapper...';
              await deployWrapper(res.id, options.wallet, options.host, options.debug)
                .then((wrapperId) => {
                  wrapperSpinner.start();
                  wrapperSpinner.succeed(
                    chalk.green(
                      `App wrapper successfully deployed at https://g8way.io/${wrapperId}`
                    )
                  );
                })
                .catch((error) => {
                  wrapperSpinner.fail();
                  throw error;
                });
            }
          })
          .catch((error) => {
            if (wrapperSpinner.isSpinning) {
              wrapperSpinner.fail();
            }
            createErr = true;
            throw error;
          });
      } catch (error: Error | any) {
        if (error instanceof Error) {
          spinner.fail(chalk.red(options.debug ? error.stack : error.message));
          createErr = true;
        } else {
          spinner.fail(chalk.red(error ? error : 'Deployment cancelled'));
          createErr = true;
        }
      }
      if (createErr) {
        return;
      }
    } else {
      print.error('Deployment cancelled');
      return;
    }
  });

program
  .command('get <id>')
  .description('Get info about an evolutionary app')
  .option('-w, --wallet <string>', 'Path to your keyfile')
  .option('--debug', 'Increase verbosity of logs and errors')
  .action(async (id: string, options) => {
    const requiredArgs: Pick<Args, 'wallet'> = {
      wallet: '',
    };

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
      ]);

      if (response.wallet) {
        requiredArgs.wallet = response.wallet;
      } else {
        console.error('No Wallet path provided');
        return;
      }
    }

    if (id.length !== 43) {
      console.error(chalk.red('Error: The provided ID must be 43 characters in length'));
      return;
    }

    let spinner: Ora = ora();

    try {
      if (options.debug) {
        spinner.start();
        spinner.text = `Fetching information for app with ID: ${id}`;
      }

      const res = await getAsset({ id, wallet: requiredArgs.wallet });
      if (options.debug) {
        spinner.succeed(`App found with following info:`);
        print.log(res);
      } else {
        print.log(res);
      }
    } catch (error: any) {
      if (options.debug) {
        spinner.color = 'red';
        spinner.fail(
          `Error occured whilst fetching data: ${options.debug ? error.stack : error.message}`
        );
      } else {
        console.error(
          chalk.red(
            `Error occured whilst fetching data: ${options.debug ? error.stack : error.message}`
          )
        );
      }
      return;
    }
  });

program.parse(process.argv);
