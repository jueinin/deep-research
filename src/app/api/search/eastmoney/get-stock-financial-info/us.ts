import { apiClient, processors, parseJsonpData, convertFieldsToChinese, FieldProcessor } from "./common";

// 美股字段处理配置 - 只保留重要且能正确翻译的字段
const usStockFieldConfig: Record<string, FieldProcessor> = {
  "SECUCODE": { name: "证券统一代码" },
  "SECURITY_CODE": { name: "证券代码" },
  "SECURITY_NAME_ABBR": { name: "证券简称" },
  "REPORT_DATE": {
    name: "报告日期",
    process: (value) => typeof value === 'string' && value.includes(' ') ? value.split(' ')[0] : String(value)
  },
  "CURRENCY": { name: "货币" },
  "PE_TTM": {
    name: "市盈率TTM",
    process: processors.toBei
  },
  "RATIO_EPS_TTM": {
    name: "每股收益TTM",
    process: processors.toFixed4
  },
  "DPS_USD": {
    name: "每股股息(USD)",
    process: processors.toFixed2
  },
  "SALE_GPR": {
    name: "毛利率",
    process: processors.toPercentWithFilter
  },
  "TURNOVER": {
    name: "收入总额",
    process: processors.toHundredMillion
  },
  "HOLDER_PROFIT": {
    name: "归母净利润",
    process: processors.toHundredMillion
  },
  "ISSUED_COMMON_SHARES": {
    name: "总股本",
    process: processors.toHundredMillion
  },
  "PB": {
    name: "市净率",
    process: processors.toBei
  },
  "BVPS": {
    name: "每股净资产",
    process: processors.toFixed2
  },
  "DIVIDEND_RATE": {
    name: "股息率",
    process: processors.toPercent
  },
  "SALE_NPR": {
    name: "净利率",
    process: processors.toPercent
  },
  "TURNOVER_YOY": {
    name: "收入总额同比",
    process: processors.toPercent
  },
  "HOLDER_PROFIT_YOY": {
    name: "归母净利润同比",
    process: processors.toPercent
  },
  "TOTAL_MARKET_CAP": {
    name: "总市值(USD)",
    process: processors.toHundredMillion
  },
  "ORG_TYPE": { name: "机构类型" },
  "SECURITY_TYPE": { name: "证券类型" },
  "CURRENCY_ABBR": { name: "货币简称" }
};

export async function handleUSStockData({ code, plainCode, market }: { code: string, plainCode: string, market: number }): Promise<Record<string, any>> {
  const baseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get";
  const usStockParams = {
    reportName: "RPT_USF10_DATA_MAININDICATOR",
    columns: "ALL",
    quoteColumns: "",
    filter: `(SECUCODE="${code}")`,
    pageNumber: "1",
    pageSize: "200",
    sortTypes: "-1",
    sortColumns: "REPORT_DATE",
    source: "INTLSECURITIES",
    client: "PC",
    v: Date.now()
  };

  const priceBaseUrl = "https://push2.eastmoney.com/api/qt/stock/get";
  const priceParams = {
    fields: "f57,f58,f43,f60,f169,f170,f171,f168,f47,f48",
    secid: `${market}.${plainCode}`,
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fltt: "2",
    cb: `cbrnd_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    v: Date.now()
  };

  const [stockResponse, priceResponse] = await Promise.all([
    apiClient.get(baseUrl, { params: usStockParams }),
    apiClient.get(priceBaseUrl, { params: priceParams, responseType: 'text' })
  ]);
  const stockData = stockResponse.data;
  const priceDataText = priceResponse.data;

  if (!stockData || !stockData.result || !stockData.result.data || !stockData.result.data.length) {
    return {
      error: "未找到美股数据",
      message: "该股票可能不存在或暂停交易"
    };
  }

  const stockInfo = stockData.result.data[0];
  const convertedData = convertFieldsToChinese(stockInfo, usStockFieldConfig);
  const priceData = parseJsonpData(priceDataText);
  return {
    当前价格: priceData.data.f43 ? processors.toFixed2(priceData.data.f43) : '--',
    ...convertedData
  };
}