"use client";
import { useState, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SymbolSelector() {
  const [open, setOpen] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:6547"
    );
    setWsClient(ws);
    return () => ws.close();
  }, []);

  // Fetch available symbols from MEXC API
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch(
          "https://contract.mexc.com/api/v1/contract/detail"
        );
        const data = await response.json();
        const symbolList = data.data
          .filter((item: any) => item.quoteCoin === "USDT")
          .map((item: any) => item.symbol.slice(0, -5));
        console.log(symbolList, "from symbol selected");
        setSymbols(symbolList);
      } catch (error) {
        console.error("Error fetching symbols:", error);
      }
    };
    fetchSymbols();
  }, []);

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) {
        return current.filter((s) => s !== symbol);
      } else {
        return [...current, symbol];
      }
    });
  };

  const handleSubmit = () => {
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
  };

  return (
    <div className="flex flex-col gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            Select symbols...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search symbols..." />
            <CommandEmpty>No symbol found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {symbols.map((symbol) => (
                  <CommandItem
                    key={symbol}
                    onSelect={() => handleSymbolToggle(symbol)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSymbols.includes(symbol)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {symbol}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-4">
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
          onClick={handleSubmit}
          disabled={selectedSymbols.length === 0}
          className="w-full"
        >
          Update Symbols ({selectedSymbols.length} selected)
        </Button>
      </div>
    </div>
  );
}
