#!/usr/bin/env node

import figlet from 'figlet'
import { Command } from 'commander'
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const pkgVersion = pkg.version

const program = new Command('mycli')

program 
    .description('A tool for creating and getting information about an Evolutionary App')
    .option('-w, --wallet <string>', 'Path to wallet keyfile')
    .option('-t, --title <string>', 'Title of application')
    .option('-d, --description <string>', 'Description of application')
    .option('-f, --forks <string>', 'Transaction ID of the app that is being forked')
    .option('-b, --balance <number>', 'Number of tokens you wish to mint for your work')
    .option('-i, --index-file <string>', `Name of the file to use as an index for manifests (relative to the folder path provided`)
    .option('--release-notes <string>', 'Path to release notes')
    .option('--no-confirmation', 'Skip confirmation step for applicable actions')
    .option('--groupId <string>', 'A unique identifier for groups of apps')
    .option('--host <string>', 'Bundlr node hostname/URL (e.g. http://node2.bundlr.network)')
    .option('--topics <string>', 'A list of comma-seperated topics (e.g. react,todo,warp)')
    .option('-d, --debug', 'Increase verbosity of logs and errors')
    .version(pkgVersion, '-v, --version', 'Gets the current version number of the cli')
    .parse(process.argv)

    program.command('get', 'Get info about an evolutionary app')

    program.command("create")
    .description("Create an evolutionary app")
    .argument("<folder>", "dir")
    .action(function() {
        console.log()
    })

const options = program.opts()
console.log(options);


if (!process.argv.slice(2).length) {
    console.log(figlet.textSync('Evolutionary Apps CLI'));
    program.outputHelp()
  }