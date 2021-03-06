import {Token} from "./Token";

const startOfWeek11 = 1625493600000;

export function totalTokenAllocation(startWeek: number): number {
  return tokenList.reduce((acc, value) => acc + value.allocation(startWeek), 0)
}

const tokenList: Token[] = [{
  token: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 0,
  ethereumSymbol: "AAVE",
  tezosSymbol: "wAAVE",
  decimals: 18,
  coincapAssetId: "aave",
  coinmetricsAssetId: "aave",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 1,
  ethereumSymbol: "BUSD",
  tezosSymbol: "wBUSD",
  decimals: 18,
  coincapAssetId: "binance-usd",
  coinmetricsAssetId: "busd",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 2,
  ethereumSymbol: "CEL",
  tezosSymbol: "wCEL",
  decimals: 4,
  coincapAssetId: "celsius",
  coinmetricsAssetId: "cel",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0xc00e94cb662c3520282e6f5717214004a7f26888",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 3,
  ethereumSymbol: "COMP",
  tezosSymbol: "wCOMP",
  decimals: 18,
  coincapAssetId: "compound",
  coinmetricsAssetId: "comp",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 0 : 1
}, {
  token: "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 4,
  ethereumSymbol: "CRO",
  tezosSymbol: "wCRO",
  decimals: 8,
  coincapAssetId: "crypto-com-coin",
  coinmetricsAssetId: "cro",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x6b175474e89094c44da98b954eedeac495271d0f",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 5,
  ethereumSymbol: "DAI",
  tezosSymbol: "wDAI",
  decimals: 18,
  coincapAssetId: "multi-collateral-dai",
  coinmetricsAssetId: "dai",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 6,
  ethereumSymbol: "FTT",
  tezosSymbol: "wFTT",
  decimals: 18,
  coincapAssetId: "ftx-token",
  coinmetricsAssetId: "ftt",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 0 : 1
}, {
  token: "0x6f259637dcd74c767781e37bc6133cd6a68aa161",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 7,
  ethereumSymbol: "HT",
  tezosSymbol: "wHT",
  decimals: 18,
  coincapAssetId: "huobi-token",
  coinmetricsAssetId: "ht",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 0 : 1
}, {
  token: "0xdf574c24545e5ffecb9a659c229253d4111d87e1",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 8,
  ethereumSymbol: "HUSD",
  tezosSymbol: "wHUSD",
  decimals: 8,
  coincapAssetId: "husd",
  coinmetricsAssetId: "husd",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 9,
  ethereumSymbol: "LEO",
  tezosSymbol: "wLEO",
  decimals: 18,
  coincapAssetId: "unus-sed-leo",
  coinmetricsAssetId: "leo_eth",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 0 : 1
}, {
  token: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 11,
  ethereumSymbol: "MATIC",
  tezosSymbol: "wMATIC",
  decimals: 18,
  coincapAssetId: "polygon",
  coinmetricsAssetId: "matic",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 2 : 1
}, {
  token: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 12,
  ethereumSymbol: "MKR",
  tezosSymbol: "wMKR",
  decimals: 18,
  coincapAssetId: "maker",
  coinmetricsAssetId: "mkr",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x75231f58b43240c9718dd58b4967c5114342a86c",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 13,
  ethereumSymbol: "OKB",
  tezosSymbol: "wOKB",
  decimals: 18,
  coincapAssetId: "okb",
  coinmetricsAssetId: "okb",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 0 : 1
}, {
  token: "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 14,
  ethereumSymbol: "PAX",
  tezosSymbol: "wPAX",
  decimals: 18,
  coincapAssetId: "paxos-standard",
  coinmetricsAssetId: "pax",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 15,
  ethereumSymbol: "SUSHI",
  tezosSymbol: "wSUSHI",
  decimals: 18,
  coincapAssetId: "sushiswap",
  coinmetricsAssetId: "sushi",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (1)
}, {
  token: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 16,
  ethereumSymbol: "UNI",
  tezosSymbol: "wUNI",
  decimals: 18,
  coincapAssetId: "uniswap",
  coinmetricsAssetId: "uni",
  type: "ERC20",
  allocation: (startWeek: number) => startWeek >= startOfWeek11 ? 1 : 2
}, {
  token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 17,
  ethereumSymbol: "USDC",
  tezosSymbol: "wUSDC",
  decimals: 6,
  coincapAssetId: "usd-coin",
  coinmetricsAssetId: "usdc",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (2)
}, {
  token: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 18,
  ethereumSymbol: "USDT",
  tezosSymbol: "wUSDT",
  decimals: 6,
  coincapAssetId: "tether",
  coinmetricsAssetId: "usdt",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (2)
}, {
  token: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 19,
  ethereumSymbol: "WBTC",
  tezosSymbol: "wWBTC",
  decimals: 8,
  coincapAssetId: "wrapped-bitcoin",
  coinmetricsAssetId: "wbtc",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (2)
}, {
  token: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 20,
  ethereumSymbol: "WETH",
  tezosSymbol: "wWETH",
  decimals: 18,
  coincapAssetId: "ethereum",
  coinmetricsAssetId: "weth",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (2)
}, {
  token: "0x514910771af9ca656af840dff83e8264ecf986ca",
  tezosContract: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
  tezosTokenId: 10,
  ethereumSymbol: "LINK",
  tezosSymbol: "wLINK",
  decimals: 18,
  coincapAssetId: "chainlink",
  coinmetricsAssetId: "link",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (2)
}, {
  token: "0x7421A18dE2eE1dC8b84E42Eb00D8B73578c23526",
  tezosContract: 'KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd',
  tezosTokenId: 0,
  ethereumSymbol: "WRAP",
  tezosSymbol: "WRAP",
  decimals: 8,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC20",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}, {
  token: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
  tezosContract: 'KT1HK3YAYwAsdzc8cXozNrZ9z3UGPSaAst8M',
  tezosTokenId: undefined,
  ethereumSymbol: "MAYC",
  tezosSymbol: "wMAYC",
  decimals: 0,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC721",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}, {
  token: "0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205",
  tezosContract: 'KT1PG3i5HdXkQT8vjXegf7hwXHVCgUJBZUbx',
  tezosTokenId: undefined,
  ethereumSymbol: "SOR",
  tezosSymbol: "wSOR",
  decimals: 0,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC721",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}, {
  token: "0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0",
  tezosContract: 'KT1KZaWKd751yymjiS4XXhB8T6csTC6Ni2Yo',
  tezosTokenId: undefined,
  ethereumSymbol: "SUPR",
  tezosSymbol: "wSUPR",
  decimals: 0,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC721",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}, {
  token: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
  tezosContract: 'KT1JnfomsnhEmXZNumzwB1uG5zzxi7ypHkox',
  tezosTokenId: undefined,
  ethereumSymbol: "BAYC",
  tezosSymbol: "wBAYC",
  decimals: 0,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC721",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}, {
  token: "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7",
  tezosContract: 'KT1QoKc3PxkYJFSRXrVmCyFq3xb5NSF52VWs',
  tezosTokenId: undefined,
  ethereumSymbol: "???",
  tezosSymbol: "w???",
  decimals: 0,
  coincapAssetId: "",
  coinmetricsAssetId: "",
  type: "ERC721",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allocation: (_startWeek: number) => (0)
}];

export default tokenList;
