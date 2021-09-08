import {Token} from "./Token";
import {totalTokenAllocation} from "./TokenList";

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
  1624888800000: 720512,
  1625493600000: 715449,
  1626098400000: 710422,
  1626703200000: 705430,
  1627308000000: 700474,
  1627912800000: 695552,
  1628517600000: 690665,
  1629122400000: 685812,
  1629727200000: 680993,
  1630332000000: 676208,
  1630936800000: 671456,
  1631541600000: 666738,
  1632146400000: 662054,
  1632751200000: 657402,
  1633356000000: 652782,
  1633960800000: 648196,
  1634565600000: 643641,
  1635170400000: 639119,
  1635775200000: 634628,
  1636380000000: 630169,
  1636984800000: 625741
};

const initialGlobalRewardsUserAllocation = 0.4;
const globalRewardsUserAllocationFromWeekStarting1623679200000 = 0.12;
const globalRewardsUserAllocationFromWeekStarting1631541600000 = 0.10;

function getRewardRatePerStartDate(start: number) {
  if (start >= 1631541600000) {
    return globalRewardsUserAllocationFromWeekStarting1631541600000
  } else if (start >= 1623679200000) {
    return globalRewardsUserAllocationFromWeekStarting1623679200000
  }
  return initialGlobalRewardsUserAllocation;
}

export function getTokenRewardForPeriod(start: number, end: number, token: Token): number {
  const globalRewardsUserAllocation = getRewardRatePerStartDate(start);
  let globalRewardForPeriod = 0;
  Object.keys(rewards).forEach(key => {
    const rewardStart = parseInt(key);
    if (rewardStart < end && rewardStart >= start) {
      globalRewardForPeriod += rewards[key];
    }
  });

  return Math.floor(globalRewardForPeriod * globalRewardsUserAllocation * (token.allocation(start) / totalTokenAllocation(start)));
}

