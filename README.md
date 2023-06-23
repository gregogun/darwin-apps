# Evolutionary Apps CLI

A CLI tool for creating Evolutionary Apps.

## Prerequisites

This tutorial assumes you have some basic knowledge of writing web applications in HTML, CSS and Javascript, as well as some basic understand of what a Permaweb app is and how to build and deploy one.

If you are not familiar with building Permaweb apps you can check out the [Permaweb Cookbook](https://cookbook.g8way.io) which contains everything you will need to get started!

Please note, you will also need an [Arweave wallet](https://arweave.app/) which holds a small amount of AR in order to deploy an evolutionary app. You can find out more about funding your wallet via bundlr [here](https://docs.bundlr.network/developer-docs/cli/funding-a-node).

---

## Installing the CLI tool

To get started with deployment, install the cli tool with the following command:

```jsx
npm install -g darwin-cli
```

To confirm installation, you can run the following command:

```jsx
darwin --version;
```

Note: Command-line arguments are available for those that prefer this workflow. You can run `darwin create -h` to see the list of options available to you.

If you decide to omit any arguments, you will be prompted for answers on both required and optional parameters.

If you wish to skip prompts for optional arguments, you can add the `--skipOptional` flag.

---

## Creating a base version

To deploy your project as an evolutionary app, you will need to run the `create` command and specify that you are creating a `base` version as well as a build directory.

Run the following command:

```
darwin create base <folder name>
```

Once you've added all the required information and confirmed your changes, two deployments will take place:

- The first deployment will upload your project to the permaweb as an Atomic Asset, with all the necessary tags.
- The second deployment will upload a wrapper around your app which will act as a fully decentralized routing mechanism for all future versions of the app.

Note: we automatically generate a manifest file for you so that should you encounter any errors between the deployment steps, you won't have to upload the individual files that make up the manifest all over again. The manifest file will be saved in your root folder under with the following name structure: `<folder name>-manifest.json`

---

## Forking an existing version

To deploy your project as a fork of another application, you will need to run the `create` command again, this time followed by `fork` and then your build directory.

Run the following command:

```
darwin create fork <folder name>
```

Once you've added all the required information and confirmed your changes, you should receive a transaction ID, as well as a link where you can view the app.

---

## Get information about a particular version

If you want to get information about a specific app version, just run the cli get command like so:

```
darwin get <transaction ID>
```

Note: you **must** enter your wallet address (for instanciating a warp instance under the hood) but please note that this action will **not** cost you.
