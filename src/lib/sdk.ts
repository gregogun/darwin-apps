import AssetSDK from "@permaweb/asset-sdk";
import Bundlr from "@bundlr-network/client";
import fs, { readFileSync } from "fs";
import { Args, Balances, Manifest } from "../types";
import { arweave, warp } from "./arweave";
import { jwkToAddress } from "../utils";
import { Contract } from "warp-contracts";
import ora, { Ora } from "ora";

export const getAsset = async ({ id, wallet }: Pick<Args, "id" | "wallet">) => {
  const jwk = JSON.parse(fs.readFileSync(wallet, "utf-8"));
  const bundlr = new Bundlr("https://node2.bundlr.network", "arweave", jwk);

  const SDK = AssetSDK.init({ arweave, bundlr, warp, wallet: jwk });

  const result = await SDK.get(id, "app");

  return result;
};

export const createAsset = async (
  {
    groupId,
    title,
    description,
    topics,
    forks,
    wallet,
    balance,
    releaseNotes,
  }: Args,
  manifest: Manifest,
  parentId: string | undefined,
  host: string | undefined,
  debug: boolean
) => {
  const jwk = JSON.parse(fs.readFileSync(wallet, "utf-8"));
  const bundlr = new Bundlr(
    host ? host : "https://node2.bundlr.network",
    "arweave",
    jwk
  );

  const SDK = AssetSDK.init({ arweave, bundlr, warp, wallet: jwk });

  const releaseNotesContent = readFileSync(releaseNotes as string, "utf-8");

  const formattedBalances = await jwkToAddress(wallet).then((address) => {
    return {
      [address]: Number(balance),
    };
  });

  let newBalances: Balances | null = null;

  if (parentId) {
    // run spinner if debug true
    let spinner: Ora = ora();
    try {
      if (debug) {
        spinner.start();
        spinner.text = `Fetching previous balances...`;
      }
      const prevBalances = await getPrevBalances(parentId);
      newBalances = Object.assign(formattedBalances, prevBalances);
      if (debug) {
        spinner.succeed(`Previous balances found and added to current balance`);
      }
    } catch (error) {
      if (debug) {
        spinner.fail(error as string);
      }
      throw error;
    }
  }

  // consider moving to format function of prompt then run only if topic is string (user input)
  const formattedTopics = topics
    .split(/[ ,]+/)
    .filter((element) => element !== "");

  const result = await SDK.create({
    groupId: groupId || "",
    type: "app",
    title,
    description,
    topics: formattedTopics,
    balances: newBalances || formattedBalances,
    forks: forks || "",
    data: JSON.stringify(manifest),
    meta: releaseNotesContent.toString() || "",
    contentType: "application/x.arweave-manifest+json",
  });

  return result;
};

const getPrevBalances = async (contractId: string) => {
  const contract: Contract = warp.contract(contractId);

  const { cachedValue }: { cachedValue: any } = await contract.readState();
  return cachedValue.state.balances;
};
