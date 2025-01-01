export interface Dataset {
    id: string;
    title: string;
    description: string;
    hash: string;
    verifiedContributorHosts: number;
    originalFilename: string;
  }
  
  export interface Contributor {
    datasetId: string;
    name: string;
    email: string;
    hostLink: string;
  }
  