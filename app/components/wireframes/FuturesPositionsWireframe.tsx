"use client";

import { useTradingStore } from "../../store/tradingStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const FuturesPositions = () => {
  const { positions } = useTradingStore();

  const longPositions = Object.entries(positions).filter(
    ([_, pos]) => pos.long > 0
  );
  const shortPositions = Object.entries(positions).filter(
    ([_, pos]) => pos.short < 0
  );

  const totalLong = Object.values(positions).reduce(
    (acc, pos) => acc + pos.long,
    0
  );
  const totalShort = Object.values(positions).reduce(
    (acc, pos) => acc + pos.short,
    0
  );
  const netExposure = totalLong + totalShort;

  return (
    <div className="space-y-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Long Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $ {totalLong.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Short Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $ {totalShort.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netExposure > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              $ {netExposure.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle>Futures Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="h-full">
            <TabsList className="mb-2">
              <TabsTrigger value="all">All Positions</TabsTrigger>
              <TabsTrigger value="long">Long</TabsTrigger>
              <TabsTrigger value="short">Short</TabsTrigger>
            </TabsList>

            <div className="h-[calc(100vh-24rem)] overflow-auto">
              <TabsContent value="all" className="h-full">
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-6 w-full gap-4 px-4 py-2 font-semibold sticky top-0 bg-white z-10">
                    <div>Symbol</div>
                    <div>Spot</div>
                    <div>Long</div>
                    <div>Short</div>
                    <div>Total</div>
                  </div>
                  {/* Table Body */}
                  {Object.entries(positions).map(([symbol, position]) => (
                    <div
                      key={symbol}
                      className="h-20 bg-gray-50 rounded flex items-center px-4"
                    >
                      <div className="grid grid-cols-6 w-full gap-4">
                        <div className="font-medium">{symbol}</div>
                        <div>{position.spot.toFixed(2)}</div>
                        <div className="text-green-600">
                          {position.long.toFixed(2)}
                        </div>
                        <div className="text-red-600">
                          {position.short.toFixed(2)}
                        </div>
                        <div>{position.total.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="long" className="h-full">
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-6 w-full gap-4 px-4 py-2 font-semibold sticky top-0 bg-white z-10">
                    <div>Symbol</div>
                    <div>Spot</div>
                    <div>Long</div>
                    <div>Short</div>
                    <div>Total</div>
                  </div>
                  {/* Table Body */}
                  {longPositions.map(([symbol, position]) => (
                    <div
                      key={symbol}
                      className="h-20 bg-gray-50 rounded flex items-center px-4"
                    >
                      <div className="grid grid-cols-6 w-full gap-4">
                        <div className="font-medium">{symbol}</div>
                        <div>{position.spot.toFixed(2)}</div>
                        <div className="text-green-600">
                          {position.long.toFixed(2)}
                        </div>
                        <div>-</div>
                        <div>{position.total.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="short" className="h-full">
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-6 w-full gap-4 px-4 py-2 font-semibold sticky top-0 bg-white z-10">
                    <div>Symbol</div>
                    <div>Spot</div>
                    <div>Long</div>
                    <div>Short</div>
                    <div>Total</div>
                  </div>
                  {/* Table Body */}
                  {shortPositions.map(([symbol, position]) => (
                    <div
                      key={symbol}
                      className="h-20 bg-gray-50 rounded flex items-center px-4"
                    >
                      <div className="grid grid-cols-6 w-full gap-4">
                        <div className="font-medium">{symbol}</div>
                        <div>{position.spot.toFixed(2)}</div>
                        <div>-</div>
                        <div className="text-red-600">
                          {position.short.toFixed(2)}
                        </div>
                        <div>{position.total.toFixed(2)}</div>
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
