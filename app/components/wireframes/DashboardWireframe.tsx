import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const DashboardWireframe: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spot Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Futures Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Net Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              Line Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Holdings Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              Pie Chart Placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};