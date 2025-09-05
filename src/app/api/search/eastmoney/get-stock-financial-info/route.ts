import { NextResponse, type NextRequest } from "next/server";
import type {
  PriceData,
  FinancialDataResponse,
  IndicatorDataResponse,
  StockFinancialInfo,
  StockFinancialInfoResponse
} from "@/types/stock";

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

const fieldMapping: Record<string, string> = {
  "SECUCODE": "证券统一代码",
  "SECURITY_CODE": "证券代码",
  "SECURITY_NAME_ABBR": "证券简称",
  "REPORT_DATE": "报告日期",
  "REPORT_TYPE": "报告类型",
  "EPSJB": "基本每股收益",
  "EPSKCJB": "扣非每股收益",
  "EPSXS": "稀释每股收益",
  "BPS": "每股净资产",
  "MGZBGJ": "每股公积金",
  "MGWFPLR": "每股未分配利润",
  "MGJYXJJE": "每股经营现金流",
  "TOTAL_OPERATEINCOME": "营业总收入",
  "TOTAL_OPERATEINCOME_LAST": "营业总收入上年同期",
  "PARENT_NETPROFIT": "归属净利润",
  "PARENT_NETPROFIT_LAST": "归属净利润上年同期",
  "ROEJQ": "加权净资产收益率",
  "ROEJQ_LAST": "加权净资产收益率上年同期",
  "XSMLL": "毛利率",
  "XSMLL_LAST": "毛利率上年同期",
  "ZCFZL": "资产负债率",
  "ZCFZL_LAST": "资产负债率上年同期",
  "YYZSRGDHBZC_LAST": "营业总收入滚动环比增长率上年同期",
  "YYZSRGDHBZC": "营业总收入滚动环比增长率",
  "NETPROFITRPHBZC": "归属净利润滚动环比增长率",
  "NETPROFITRPHBZC_LAST": "归属净利润滚动环比增长率上年同期",
  "KFJLRGDHBZC": "扣非净利润滚动环比增长率",
  "KFJLRGDHBZC_LAST": "扣非净利润滚动环比增长率上年同期",
  "TOTALOPERATEREVETZ": "营业总收入同比增长率",
  "TOTALOPERATEREVETZ_LAST": "营业总收入同比增长率上年同期",
  "PARENTNETPROFITTZ": "归属净利润同比增长率",
  "PARENTNETPROFITTZ_LAST": "归属净利润同比增长率上年同期",
  "TOTAL_SHARE": "总股本",
  "FREE_SHARE": "流通股本",
  "EPSJB_PL": "基本每股收益披露值",
  "BPS_PL": "每股净资产披露值",
  "FORMERNAME": "曾用名",
  // 新增指标字段
  "EQUITY_NEW_REPORT": "最新净资产",
  "PE_DYNAMIC": "市盈率动",
  "PE_STATIC": "市盈率静",
  "PE_TTM": "市盈率TTM",
  "PB_NEW_NOTICE": "市净率",
  "TOTAL_MARKET_CAP": "总市值",
  "PB_MRQ_REALTIME": "市净率实时"
};

// 转换单个对象的字段名为中文
function convertFieldsToChinese<T>(item: T): Record<string, any> {
  const convertedItem: Record<string, any> = {};
  for (const [key, value] of Object.entries(item as any)) {
    const chineseKey = fieldMapping[key] || key;
    convertedItem[chineseKey] = value;
  }
  return convertedItem;
}

// 合并财务数据、指标数据和价格数据
function mergeStockData(
  financialData: FinancialDataResponse,
  indicatorData: IndicatorDataResponse,
  currentPrice: number
): StockFinancialInfo {
  const financialItem = financialData.result.data[0];
  const indicatorItem = indicatorData.result.data[0];
  
  // 转换财务数据为中文
  const convertedFinancial = convertFieldsToChinese(financialItem);
  
  // 转换指标数据为中文
  const convertedIndicator = convertFieldsToChinese(indicatorItem);
  
  // 创建整合的股票财务信息对象
  const stockInfo: StockFinancialInfo = {
    当前价格: currentPrice,
    ...convertedFinancial,
    ...convertedIndicator,
  } as any
  return stockInfo;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code"); // example 000282.SH
  if (!code) {
    return NextResponse.json(
      { code: 400, message: "股票代码不能为空" },
      { status: 400 }
    );
  }
  const plainCode = code.split('.')?.[0] || ''
  // 构建东方财富API请求URL - 财务数据
  const baseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get";
  // 移除可能导致问题的字段，保留基本财务信息字段
  const columns = "SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,REPORT_DATE,REPORT_TYPE,EPSJB,EPSKCJB,EPSXS,BPS,MGZBGJ,MGWFPLR,MGJYXJJE,TOTAL_OPERATEINCOME,TOTAL_OPERATEINCOME_LAST,PARENT_NETPROFIT,PARENT_NETPROFIT_LAST,ROEJQ,ROEJQ_LAST,XSMLL,XSMLL_LAST,ZCFZL,ZCFZL_LAST,YYZSRGDHBZC_LAST,YYZSRGDHBZC,NETPROFITRPHBZC,NETPROFITRPHBZC_LAST,KFJLRGDHBZC,KFJLRGDHBZC_LAST,TOTALOPERATEREVETZ,TOTALOPERATEREVETZ_LAST,PARENTNETPROFITTZ,PARENTNETPROFITTZ_LAST,TOTAL_SHARE,FREE_SHARE,EPSJB_PL,BPS_PL,FORMERNAME";
  const filter = `(SECUCODE%3D%22${code}%22)`;
  const financialUrl = `${baseUrl}?reportName=RPT_PCF10_FINANCEMAINFINADATA&columns=${columns}&quoteColumns=&filter=${filter}&sortTypes=-1&sortColumns=REPORT_DATE&pageNumber=1&pageSize=1&source=HSF10&client=PC&v=${Date.now()}`;

  // 构建东方财富API请求URL - 指标数据
  const indicatorColumns = "SECURITY_CODE,SECUCODE";
  const quoteColumns = "f9~01~SECURITY_CODE~PE_DYNAMIC,f114~01~SECURITY_CODE~PE_STATIC,f115~01~SECURITY_CODE~PE_TTM,f23~01~SECURITY_CODE~PB_NEW_NOTICE,f20~01~SECURITY_CODE~TOTAL_MARKET_CAP";
  const indicatorUrl = `${baseUrl}?reportName=RPT_DMSK_NEWINDICATOR&columns=${indicatorColumns}&quoteColumns=${quoteColumns}&filter=${filter}&sortTypes=&sortColumns=&pageNumber=1&pageSize=1&source=HSF10&client=PC&v=${Date.now()}`;
  // 价格数据
  const priceURL = `https://push2.eastmoney.com/api/qt/stock/get?fields=f57%2Cf58%2Cf47%2Cf43%2Cf169%2Cf170%2Cf44%2Cf45%2Cf46%2Cf48%2Cf60%2Cf168%2Cf164%2Cf50%2Cf171&secid=0.${plainCode}&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&wbp2u=%7C0%7C0%7C0%7Cweb&v=${Date.now()}`
  const priceURL2 = `
https://push2.eastmoney.com/api/qt/stock/get?invt=2&fltt=1&cb=jQuery35107067384626809018_1757090469402&fields=f58%2Cf734%2Cf107%2Cf57%2Cf43%2Cf59%2Cf169%2Cf301%2Cf60%2Cf170%2Cf152%2Cf177%2Cf111%2Cf46%2Cf44%2Cf45%2Cf47%2Cf260%2Cf48%2Cf261%2Cf279%2Cf277%2Cf278%2Cf288%2Cf19%2Cf17%2Cf531%2Cf15%2Cf13%2Cf11%2Cf20%2Cf18%2Cf16%2Cf14%2Cf12%2Cf39%2Cf37%2Cf35%2Cf33%2Cf31%2Cf40%2Cf38%2Cf36%2Cf34%2Cf32%2Cf211%2Cf212%2Cf213%2Cf214%2Cf215%2Cf210%2Cf209%2Cf208%2Cf207%2Cf206%2Cf161%2Cf49%2Cf171%2Cf50%2Cf86%2Cf84%2Cf85%2Cf168%2Cf108%2Cf116%2Cf167%2Cf164%2Cf162%2Cf163%2Cf92%2Cf71%2Cf117%2Cf292%2Cf51%2Cf52%2Cf191%2Cf192%2Cf262%2Cf294%2Cf181%2Cf295%2Cf748%2Cf747%2Cf803&secid=1.${plainCode}&ut=fa5fd1943c7b386f172d6893dbfba10b&wbp2u=%7C0%7C0%7C0%7Cweb&dect=1&_=${Date.now()}`
  const headers = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    "Connection": "keep-alive",
    "Origin": "https://emweb.securities.eastmoney.com",
    "Referer": "https://emweb.securities.eastmoney.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"'
  };

  // 并行请求两个API
  const [financialResponse, indicatorResponse, priceResponse, price2Response] = await Promise.all([
    fetch(financialUrl, { method: "GET", headers }),
    fetch(indicatorUrl, { method: "GET", headers }),
    fetch(priceURL, {method: 'GET', headers}),
    fetch(priceURL2, {method: 'GET', headers})
  ]);

  const financialData = await financialResponse.json();
  const indicatorData = await indicatorResponse.json();
  const priceData = await priceResponse.json()
  const price2Text = await price2Response.text()
  const jsonStart = price2Text.indexOf("(");
  const jsonEnd = price2Text.lastIndexOf(")");
  const jsonString = price2Text.substring(jsonStart + 1, jsonEnd);
  const price2Data = JSON.parse(jsonString);
  const currentPrice = priceData.data?.f43 ?? (price2Data?.data?.f43 / 100) ?.toFixed(2) ?? 0
  const mergedStockData = mergeStockData(financialData, indicatorData, currentPrice);
  
  // 返回整合后的响应
  const response: StockFinancialInfoResponse = {
    success: true,
    message: "获取股票财务信息成功",
    code: 0,
    data: mergedStockData
  };
  
  return NextResponse.json(response);
}