// app/components/PositionsTable.tsx
import { useTradingStore } from '../store/tradingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const PositionsTable = () => {
  const { positions } = useTradingStore();

  const nonZeroPositions = Object.entries(positions).filter(
    ([_, pos]) => pos.spot !== 0 || pos.long !== 0 || pos.short !== 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Positions</TabsTrigger>
            <TabsTrigger value="active">Active Positions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {Object.entries(positions).map(([symbol, position]) => (
                <div key={symbol} className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">{symbol}</div>
                  <div className={position.spot > 0 ? 'text-green-600' : ''}>
                    {position.spot.toFixed(2)}
                  </div>
                  <div className={position.long > 0 ? 'text-green-600' : ''}>
                    {position.long.toFixed(2)}
                  </div>
                  <div className={position.short < 0 ? 'text-red-600' : ''}>
                    {position.short.toFixed(2)}
                  </div>
                  <div className={position.total > 0 ? 'text-green-600' : position.total < 0 ? 'text-red-600' : ''}>
                    {position.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="space-y-4">
              {nonZeroPositions.map(([symbol, position]) => (
                <div key={symbol} className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">{symbol}</div>
                  <div className={position.spot > 0 ? 'text-green-600' : ''}>
                    {position.spot.toFixed(2)}
                  </div>
                  <div className={position.long > 0 ? 'text-green-600' : ''}>
                    {position.long.toFixed(2)}
                  </div>
                  <div className={position.short < 0 ? 'text-red-600' : ''}>
                    {position.short.toFixed(2)}
                  </div>
                  <div className={position.total > 0 ? 'text-green-600' : position.total < 0 ? 'text-red-600' : ''}>
                    {position.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};