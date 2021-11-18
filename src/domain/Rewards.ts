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
  1636984800000: 625741,
  1637589600000: 621344,
  1638194400000: 616978,
  1638799200000: 612643,
  1639404000000: 608338,
  1640008800000: 604064,
  1640613600000: 599819,
  1641218400000: 595605,
  1641823200000: 591420,
  1642428000000: 587264,
  1643032800000: 583138,
  1643637600000: 579040,
  1644242400000: 574972,
  1644847200000: 570932,
  1645452000000: 566920,
  1646056800000: 562937,
  1646661600000: 558981,
  1647266400000: 555053,
  1647871200000: 551153,
  1648476000000: 547281,
  1649080800000: 543435,
  1649685600000: 539617,
  1650290400000: 535825,
  1650895200000: 532060,
  1651500000000: 528322,
  1652104800000: 524610,
  1652709600000: 520923,
  1653314400000: 517263,
  1653919200000: 513629,
  1654524000000: 510020,
  1655128800000: 506436
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

