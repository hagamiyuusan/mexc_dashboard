"use client";

import { useTradingStore } from "../../store/tradingStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const FuturesPositions = () => {
  const { positions } = useTradingStore();
  const [symbolInput, setSymbolInput] = useState<string>("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [clickedUpdate, setClickedUpdate] = useState<boolean>(true);
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
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSymbols = symbolInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Create a set to ensure uniqueness
    const uniqueSymbols = new Set([...selectedSymbols, ...newSymbols]);

    // Convert the set back to an array
    setSelectedSymbols(Array.from(uniqueSymbols));
    setSymbolInput("");
  };

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols((current) =>
      current.includes(symbol)
        ? current.filter((s) => s !== symbol)
        : [...current, symbol]
    );
  };
  useEffect(() => {
    // Initialize the WebSocket connection
    ws.current = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:6547"
    );

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      ws.current?.send(JSON.stringify({ type: "get_symbols" }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "list_symbols") {
        setSelectedSymbols(data.data);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleWebSocketSubmit = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "update_symbols",
          data: {
            symbols: selectedSymbols,
          },
        })
      );
      setClickedUpdate(true);
      setSymbolInput("");
      toast.success("Symbols updated successfully");
    }
  };

  const handleGetSymbols = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "get_symbols" }));
      toast.success("Requested current symbols");
    }
  };

  return (
    <div className="space-y-6 h-full">
      <Separator />

      {/* Add Symbol Selector section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Symbol Selection</span>
            {/* <Button variant="outline" size="sm" onClick={handleGetSymbols}>
              Get Current Symbols
            </Button> */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleInputSubmit} className="flex gap-2">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => {
                setSymbolInput(e.target.value);
                setClickedUpdate(false);
              }}
              placeholder="Enter symbols separated by commas"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button type="submit">Add Symbols</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {selectedSymbols.map((symbol) => (
              <Badge
                key={symbol}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleSymbolToggle(symbol)}
              >
                {symbol}
                <span className="ml-1">×</span>
              </Badge>
            ))}
          </div>

          <Button
            onClick={handleWebSocketSubmit}
            disabled={selectedSymbols.length === 0}
            className="w-full"
          >
            {clickedUpdate
              ? "Nothing to update"
              : `Update Symbols (${selectedSymbols.length} selected)`}
          </Button>
        </CardContent>
      </Card>
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
