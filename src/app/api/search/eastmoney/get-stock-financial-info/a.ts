import { FinancialDataResponse, IndicatorDataResponse, PriceData, StockFinancialInfo } from "@/types/stock";
import { apiClient } from "./common";

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
  

export async function handleAStockData({ code, plainCode, market }: { code: string, plainCode: string, market: number }) {
    const baseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get";
    const columns = "SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,REPORT_DATE,REPORT_TYPE,EPSJB,EPSKCJB,EPSXS,BPS,MGZBGJ,MGWFPLR,MGJYXJJE,TOTAL_OPERATEINCOME,TOTAL_OPERATEINCOME_LAST,PARENT_NETPROFIT,PARENT_NETPROFIT_LAST,ROEJQ,ROEJQ_LAST,XSMLL,XSMLL_LAST,ZCFZL,ZCFZL_LAST,YYZSRGDHBZC_LAST,YYZSRGDHBZC,NETPROFITRPHBZC,NETPROFITRPHBZC_LAST,KFJLRGDHBZC,KFJLRGDHBZC_LAST,TOTALOPERATEREVETZ,TOTALOPERATEREVETZ_LAST,PARENTNETPROFITTZ,PARENTNETPROFITTZ_LAST,TOTAL_SHARE,FREE_SHARE,EPSJB_PL,BPS_PL,FORMERNAME";
    const filter = `(SECUCODE="${code}")`;
  
    const financialParams = {
      reportName: "RPT_PCF10_FINANCEMAINFINADATA",
      columns,
      quoteColumns: "",
      filter,
      sortTypes: "-1",
      sortColumns: "REPORT_DATE",
      pageNumber: "1",
      pageSize: "1",
      source: "HSF10",
      client: "PC",
      v: Date.now()
    };
  
    const indicatorColumns = "SECURITY_CODE,SECUCODE";
    const quoteColumns = "f9~01~SECURITY_CODE~PE_DYNAMIC,f114~01~SECURITY_CODE~PE_STATIC,f115~01~SECURITY_CODE~PE_TTM,f23~01~SECURITY_CODE~PB_NEW_NOTICE,f20~01~SECURITY_CODE~TOTAL_MARKET_CAP";
    const indicatorParams = {
      reportName: "RPT_DMSK_NEWINDICATOR",
      columns: indicatorColumns,
      quoteColumns,
      filter,
      sortTypes: "",
      sortColumns: "",
      pageNumber: "1",
      pageSize: "1",
      source: "HSF10",
      client: "PC",
      v: Date.now()
    };
  
    // 价格数据请求参数
    const priceBaseUrl = "https://push2.eastmoney.com/api/qt/stock/get";
    const priceParams = {
      fields: "f57,f58,f47,f43,f169,f170,f44,f45,f46,f48,f60,f168,f164,f50,f171",
      secid: `${market}.${plainCode}`,
      ut: "bd1d9ddb04089700cf9c27f6f7426281",
      fltt: "2",
      wbp2u: "|0|0|0|web",
      v: Date.now()
    };
    const [financialResponse, indicatorResponse, priceResponse] = await Promise.all([
      apiClient.get<FinancialDataResponse>(baseUrl, { params: financialParams }),
      apiClient.get<IndicatorDataResponse>(baseUrl, { params: indicatorParams }),
      apiClient.get<PriceData>(priceBaseUrl, { params: priceParams }),
    ]);
  
    const financialData = financialResponse.data;
    const indicatorData = indicatorResponse.data;
    const priceData = priceResponse.data;
    const currentPrice = priceData.data?.f43 || 0;
    const mergedStockData = mergeStockData(financialData, indicatorData, currentPrice);
    return mergedStockData
  }
  