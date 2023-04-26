export interface Args {
    id?: string
    title: string
    description: string
    groupId?: string
    topics: string
    balances: number
    forks?: string
    ['release-notes']?: string
    wallet: string
    directory?: string
    debug?: boolean
  }