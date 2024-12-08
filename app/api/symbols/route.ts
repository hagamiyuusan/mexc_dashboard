import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch("https://contract.mexc.com/api/v1/contract/detail");
    const data = await response.json();
    
    // Extract symbols, removing the last 5 characters (e.g., "USDT")
    const symbolList = data.data
      .filter((item: any) => item.quoteCoin === "USDT")
      .map((item: any) => item.symbol.slice(0, -5));

    return NextResponse.json({ 
      success: true,
      data: symbolList 
    });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch symbols" 
    }, { 
      status: 500 
    });
  }
}