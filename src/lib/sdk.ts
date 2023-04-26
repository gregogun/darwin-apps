import AssetSDK from '@permaweb/asset-sdk'
import Bundlr from '@bundlr-network/client'
import fs from 'fs'
import { Args } from '../types'
import { arweave, warp } from './arweave'

export const getAsset = async ({
    id,
    wallet,
  }: Pick<Args, 'id' | 'wallet'>) => {

    const jwk = JSON.parse(fs.readFileSync(wallet, 'utf-8'))
    const bundlr = new Bundlr('https://node2.bundlr.network', 'arweave', jwk)
  
    const SDK = AssetSDK.init({ arweave, bundlr, warp, wallet: jwk })
  
    const result = await SDK.get(id, 'app')
  
    return result
  }