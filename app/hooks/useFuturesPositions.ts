import { useTradingStore } from '../store/tradingStore';

export const useFuturesPositions = () => {
  const { futuresPositions } = useTradingStore();

  const totalLongExposure = futuresPositions
    .filter(pos => pos.side === 'LONG')
    .reduce((acc, pos) => acc + pos.positionSize * pos.currentPrice, 0);

  const totalShortExposure = futuresPositions
    .filter(pos => pos.side === 'SHORT')
    .reduce((acc, pos) => acc + pos.positionSize * pos.currentPrice, 0);

  const netExposure = totalLongExposure - totalShortExposure;

  const longPositions = futuresPositions.filter(pos => pos.side === 'LONG');
  const shortPositions = futuresPositions.filter(pos => pos.side === 'SHORT');

  return {
    positions: futuresPositions,
    totalLongExposure,
    totalShortExposure,
    netExposure,
    longPositions,
    shortPositions,
  };
};