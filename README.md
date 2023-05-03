# Evolutionary Apps CLI

A CLI tool for creating Evolutionary Apps.

## Installing the CLI tool

To get started with deployment, install the cli tool with the following command:

```jsx
npm install -g @evo-apps/cli
```

To confirm installation, you can run the following command:

```jsx
@evo-apps --version;
```

Note: Command-line arguments are available for those that prefer this workflow. If you omit arguments, you will be prompted for answers on both required and optional parameters. If you wish to skip prompts for optional arguments, you can add the `--skipOptional` flag.

---

## Creating a base version

To deploy your app as a base version (you are not remixing another app), you will need to run the `create` command and specify that you are creating a `base` version as well as a build directory.

Run the following command:

```jsx
evo-apps create base <folder name here>
```

You can run `evo-apps create -h` to see the list of options available to you.
