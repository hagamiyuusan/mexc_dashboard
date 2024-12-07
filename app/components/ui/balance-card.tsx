import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceCardProps {
  title: string;
  value: number;
  currency?: string;
  isLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  value,
  currency = 'USD',
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span className="text-2xl font-bold">
            {currency} {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </CardContent>
    </Card>
  );
};