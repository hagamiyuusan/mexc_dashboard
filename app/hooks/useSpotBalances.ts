import { useTradingStore } from '../store/tradingStore';

export const useSpotBalances = () => {
  const { spotBalances } = useTradingStore();

  const totalBalance = spotBalances.reduce((acc, balance) => acc + balance.total, 0);
  
  const nonZeroBalances = spotBalances.filter(balance => balance.total > 0);

  return {
    balances: spotBalances,
    totalBalance,
    nonZeroBalances,
  };
};