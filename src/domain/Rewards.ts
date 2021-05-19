import {Token} from "./Token";

const rewards: Record<number, number> = {
  1619445600000: 767719,
  1620050400000: 762324,
  1620655200000: 756968,
  1621260000000: 751649,
  1621864800000: 746368,
  1622469600000: 741123,
  1623074400000: 735916,
  1623679200000: 730745,
  1624284000000: 725610,
  1624888800000: 720512
};

const globalRewardsUserAllocation = 0.4;
const totalTokenAllocation = 27;

export function getTokenRewardForPeriod(start: number, end: number, token: Token): number {
  let globalRewardForPeriod = 0;
  Object.keys(rewards).forEach(key => {
    const rewardStart = parseInt(key);
    if (rewardStart < end && rewardStart >= start) {
      globalRewardForPeriod += rewards[key];
    }
  });

  return Math.round(globalRewardForPeriod * globalRewardsUserAllocation * (token.allocation / totalTokenAllocation));
}

