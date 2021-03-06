export interface LiquidityMiningApy {
  base: string;
  quote: string;
  apy: string;
  apr: string;
  totalRewardsPerDay: string;
  totalRewardsPerDayInUsd: string;
  totalStakedInUsd: string;
  totalStaked: string;
  farmingContract: string;
  quipuswapContract: string;
  running: boolean;
  remainingBlocks: number;
  remainingSeconds: number;
}
