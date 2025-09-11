import { NextResponse, type NextRequest } from "next/server";
import { apiClient, parseJsonpData, processors } from "../get-stock-financial-info/common";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1", 
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

const TREASURY_CODES = {
  cn10y: "171.CN10Y",
  us10y: "171.US10Y",
};

const fetchTreasuryYield = async (secid: string): Promise<string | null> => {
  const params = {
    invt: "2",
    fltt: "1", 
    cb: `jQuery${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
    fields: "f43",
    secid,
    ut: "fa5fd1943c7b386f172d6893dbfba10b",
    wbp2u: "|0|0|0|web",
    dect: "1",
    _: Date.now().toString()
  };

  const response = await apiClient.get("https://push2.eastmoney.com/api/qt/stock/get", { 
    params, 
    timeout: 5000 
  });
  
  const data = parseJsonpData(response.data);
  const rawValue = data?.data?.f43;
  
  if (!rawValue || typeof rawValue !== 'number') return null;
  
  const percentage = rawValue / 10000;
  return processors.toFixed2(percentage) + '%';
};

export async function GET(req: NextRequest) {
  const [cn10y, us10y] = await Promise.all([
    fetchTreasuryYield(TREASURY_CODES.cn10y),
    fetchTreasuryYield(TREASURY_CODES.us10y)
  ]);

  return NextResponse.json({
    ...(cn10y && { cn10y }),
    ...(us10y && { us10y })
  });
}
