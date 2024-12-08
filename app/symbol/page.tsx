"use client";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SymbolSelector() {
  const [symbolInput, setSymbolInput] = useState<string>("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);

  // Keep WebSocket connection setup
  useEffect(() => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:6547"
    );
    setWsClient(ws);
    return () => ws.close();
  }, []);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Split input by commas, trim whitespace, and filter out empty strings
    const newSymbols = symbolInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSelectedSymbols(newSymbols);
    setSymbolInput(""); // Clear input after submission
  };

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols((current) =>
      current.includes(symbol)
        ? current.filter((s) => s !== symbol)
        : [...current, symbol]
    );
  };

  const handleWebSocketSubmit = () => {
    if (wsClient?.readyState === WebSocket.OPEN) {
      wsClient.send(
        JSON.stringify({
          type: "update_symbols",
          data: {
            symbols: selectedSymbols,
          },
        })
      );
    }
    setSymbolInput("");
    setSelectedSymbols([]);
    toast.success("Symbols updated successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleInputSubmit} className="flex gap-2">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
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
        Update Symbols ({selectedSymbols.length} selected)
      </Button>
    </div>
  );
}
