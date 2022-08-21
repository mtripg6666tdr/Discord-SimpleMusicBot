declare namespace NodeJS {
  interface ProcessEnv {
    readonly TOKEN:string;
    readonly CSE_KEY?:string;
    readonly CLIENT_ID?:string;
    readonly GUILD_ID?:string;
    readonly GAS_URL?:string;
    readonly GAS_TOKEN:string;
  }
}
