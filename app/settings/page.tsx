"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ApiSettings() {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    const ws = new WebSocket("ws://localhost:6547");

    ws.onopen = () => {
      const message = {
        type: "api_credentials",
        data: {
          access_key: accessKey,
          secret_key: secretKey,
        },
      };

      ws.send(JSON.stringify(message));

      toast({
        title: "Settings Updated",
        description: "API credentials have been updated successfully.",
      });

      ws.close();
    };

    ws.onerror = (error) => {
      toast({
        title: "Error",
        description: "Failed to update API credentials.",
        variant: "destructive",
      });
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MEXC API Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Access Key</label>
          <Input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Enter your MEXC access key"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Secret Key</label>
          <Input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter your MEXC secret key"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Update API Keys
        </Button>
      </CardContent>
    </Card>
  );
}
