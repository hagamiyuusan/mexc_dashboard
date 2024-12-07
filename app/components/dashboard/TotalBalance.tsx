import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradingStore } from '../../store/tradingStore';

export const TotalBalance: React.FC = () => {
  const { getTotalSpotBalance, getTotalFuturesExposure, getNetExposure } = useTradingStore();

  const totalSpot = getTotalSpotBalance();
  const totalFutures = getTotalFuturesExposure();
  const netExposure = getNetExposure();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Spot Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {totalSpot.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Futures Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {totalFutures.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Net Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {netExposure.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};