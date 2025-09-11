import { NextResponse, type NextRequest } from "next/server";
import type {
  StockFinancialInfoResponse
} from "@/types/stock";
import { match } from "ts-pattern";
import { handleAStockData } from "./a";
import { handleUSStockData } from "./us";

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
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code"); // example 000282.SH
  const market = +(searchParams.get("market") || '0'); // example 0 1 105
  if (!code) {
    return NextResponse.json(
      { code: 400, message: "股票代码不能为空" },
      { status: 400 }
    );
  }
  const plainCode = code.split('.')?.[0] || ''
  const data = await match({ market })
    .with({ market: 1 }, { market: 0 }, () => handleAStockData({ code, plainCode, market }) as Promise<Record<string, unknown>>)
    .with({ market: 105 }, {market: 106 }, {market: 107}, () => handleUSStockData({ code, plainCode, market }) as Promise<Record<string, unknown>>)
    .run()
  const response: StockFinancialInfoResponse = {
    success: true,
    message: "获取股票财务信息成功",
    code: 0,
    data: data
  };
  return NextResponse.json(response);
}

