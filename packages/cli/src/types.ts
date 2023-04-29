export interface Args {
  id?: string;
  title: string;
  description: string;
  groupId?: string;
  topics: string;
  balance: number;
  forks?: string;
  releaseNotes?: string;
  wallet: string;
  directory?: string;
  debug?: boolean;
}

export interface Manifest {
  manifest: string;
  version: string;
  index?: {
    path: string;
  };
  paths: {
    [key: string]: {
      id: string;
    };
  };
}

export type Balances = {
  [key: string]: number;
};
