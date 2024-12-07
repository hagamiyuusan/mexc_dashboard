'use client';
import { useTradingStore } from '../../store/tradingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const SpotBalances = () => {
  const { positions, getTotalSpotBalance } = useTradingStore();
  
  const nonZeroBalances = Object.entries(positions).filter(
    ([_, pos]) => pos.spot !== 0
  );

  const totalBalance = getTotalSpotBalance();

  return (
    <div className="space-y-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spot Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $ {totalBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Spot Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="h-[calc(100vh-24rem)]">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Assets</TabsTrigger>
              <TabsTrigger value="non-zero">Non-zero Balances</TabsTrigger>
            </TabsList>
            
            <div className="h-full overflow-hidden">
              <TabsContent value="all" className="h-full">
                <div className="space-y-4 h-full overflow-y-auto pr-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-2 w-full gap-4 px-4 py-2 font-semibold sticky top-0 bg-white">
                    <div>Symbol</div>
                    <div>Balance</div>
                  </div>
                  {/* Table Body */}
                  {Object.entries(positions).map(([symbol, position]) => (
                    <div key={symbol} className="h-16 bg-gray-50 rounded flex items-center px-4">
                      <div className="grid grid-cols-2 w-full gap-4">
                        <div className="font-medium">{symbol}</div>
                        <div className={position.spot > 0 ? 'text-green-600' : ''}>
                          {position.spot.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="non-zero" className="h-full">
                <div className="space-y-4 h-full overflow-y-auto pr-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-2 w-full gap-4 px-4 py-2 font-semibold sticky top-0 bg-white">
                    <div>Symbol</div>
                    <div>Balance</div>
                  </div>
                  {/* Table Body */}
                  {nonZeroBalances.map(([symbol, position]) => (
                    <div key={symbol} className="h-16 bg-gray-50 rounded flex items-center px-4">
                      <div className="grid grid-cols-2 w-full gap-4">
                        <div className="font-medium">{symbol}</div>
                        <div className={position.spot > 0 ? 'text-green-600' : ''}>
                          {position.spot.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};