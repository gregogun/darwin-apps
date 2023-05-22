// import AssetSDK from '@permaweb/asset-sdk';
import AssetSDK from 'test-asset-sdk';
import Bundlr from '@bundlr-network/client';
import fs from 'fs';
import { Args, Balances, Manifest } from '../types';
import { arweave, warp } from './arweave';
import { jwkToAddress } from '../utils';
import { Contract } from 'warp-contracts';
import { Ora } from 'ora';

export const getAsset = async ({ id, wallet }: Pick<Args, 'id' | 'wallet'>) => {
  const jwk = JSON.parse(fs.readFileSync(wallet, 'utf-8'));
  const bundlr = new Bundlr('https://node2.bundlr.network', 'arweave', jwk);

  const SDK = AssetSDK.init({ arweave, bundlr, warp, wallet: jwk });

  const result = await SDK.get(id, 'app');

  return result;
};

export const createAsset = async (
  { groupId, title, description, topics, forks, wallet, balance, releaseNotes, sourceCode }: Args,
  manifest: Manifest,
  parentId: string | undefined,
  host: string | undefined,
  logo: string | undefined,
  debug: boolean,
  spinner: Ora
) => {
  const jwk = JSON.parse(fs.readFileSync(wallet, 'utf-8'));
  const bundlr = new Bundlr(host ? host : 'https://node2.bundlr.network', 'arweave', jwk);

  const SDK = AssetSDK.init({ arweave, bundlr, warp, wallet: jwk });

  const formattedBalances = await jwkToAddress(wallet).then((address) => {
    return {
      [address]: Number(balance),
    };
  });

  let newBalances: Balances | null = null;

  if (parentId) {
    // run spinner if debug true
    try {
      if (debug) {
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
  const formattedTopics = topics.split(/[ ,]+/).filter((element) => element !== '');

  const result = await SDK.create({
    groupId: groupId || '',
    type: 'app',
    title,
    description,
    topics: formattedTopics,
    balances: newBalances || formattedBalances,
    forks: forks || '',
    data: JSON.stringify(manifest),
    meta: releaseNotes || '',
    contentType: 'application/x.arweave-manifest+json',
    customTags: [
      { name: 'Source-Code', value: sourceCode },
      { name: 'Logo', value: logo || '' },
    ],
  });

  return result;
};

const getPrevBalances = async (contractId: string) => {
  const contract: Contract = warp.contract(contractId);

  const { cachedValue }: { cachedValue: any } = await contract.readState();
  return cachedValue.state.balances;
};
