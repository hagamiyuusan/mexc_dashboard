import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Column {
  key: string;
  title: string;
  width?: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  tabs?: { value: string; label: string; filter: (item: any) => boolean }[];
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  tabs,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tabs ? (
          <Tabs defaultValue={tabs[0].value}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))
                ) : (
                  data.filter(tab.filter).map((row, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded flex items-center px-4">
                      <div className={`grid grid-cols-${columns.length} w-full gap-4`}>
                        {columns.map((col) => (
                          <div key={col.key} className={col.width}>
                            {row[col.key]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))
            ) : (
              data.map((row, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded flex items-center px-4">
                  <div className={`grid grid-cols-${columns.length} w-full gap-4`}>
                    {columns.map((col) => (
                      <div key={col.key} className={col.width}>
                        {row[col.key]}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};