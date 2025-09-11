import { FinancialDataResponse, IndicatorDataResponse, PriceData } from "@/types/stock";
import { apiClient, convertFieldsToChinese, processors, FieldProcessor } from "./common";

// A股字段配置
const aStockFieldConfig: Record<string, FieldProcessor> = {
  "SECUCODE": { name: "证券统一代码" },
  "SECURITY_CODE": { name: "证券代码" },
  "SECURITY_NAME_ABBR": { name: "证券简称" },
  "REPORT_DATE": {
    name: "报告日期",
    process: (value) => typeof value === 'string' && value.includes(' ') ? value.split(' ')[0] : String(value)
  },
  "REPORT_TYPE": { name: "报告类型" },
    "EPSJB": { 
        name: "基本每股收益",
        process: processors.toYuan
    },
    "EPSKCJB": { 
        name: "扣非每股收益",
        process: processors.toYuan
    },
    "EPSXS": { 
        name: "稀释每股收益",
        process: processors.toYuan
    },
    "BPS": {
        name: "每股净资产",
        process: processors.toYuan
    },
    "MGZBGJ": { 
        name: "每股公积金",
        process: processors.toYuan
    },
    "MGWFPLR": { 
        name: "每股未分配利润",
        process: processors.toYuan
    },
    "MGJYXJJE": { 
        name: "每股经营现金流",
        process: processors.toYuan
    },
    "TOTAL_OPERATEINCOME": {
        name: "营业总收入",
        process: processors.toSmartAmount
    },
    "TOTAL_OPERATEINCOME_LAST": {
        name: "营业总收入上年同期",
        process: processors.toSmartAmount
    },
    "PARENT_NETPROFIT": {
        name: "归属净利润",
        process: processors.toSmartAmount
    },
    "PARENT_NETPROFIT_LAST": {
        name: "归属净利润上年同期",
        process: processors.toSmartAmount
    },
    "ROEJQ": {
        name: "加权净资产收益率",
        process: processors.toPercent
    },
    "ROEJQ_LAST": {
        name: "加权净资产收益率上年同期",
        process: processors.toPercent
    },
    "XSMLL": {
        name: "毛利率",
        process: processors.toPercentWithFilter
    },
    "XSMLL_LAST": {
        name: "毛利率上年同期",
        process: processors.toPercentWithFilter
    },
    "ZCFZL": {
        name: "资产负债率",
        process: processors.toPercent
    },
    "ZCFZL_LAST": {
        name: "资产负债率上年同期",
        process: processors.toPercent
    },
    "YYZSRGDHBZC_LAST": {
        name: "营业总收入滚动环比增长率上年同期",
        process: processors.toPercent
    },
    "YYZSRGDHBZC": {
        name: "营业总收入滚动环比增长率",
        process: processors.toPercent
    },
    "NETPROFITRPHBZC": {
        name: "归属净利润滚动环比增长率",
        process: processors.toPercent
    },
    "NETPROFITRPHBZC_LAST": {
        name: "归属净利润滚动环比增长率上年同期",
        process: processors.toPercent
    },
    "KFJLRGDHBZC": {
        name: "扣非净利润滚动环比增长率",
        process: processors.toPercent
    },
    "KFJLRGDHBZC_LAST": {
        name: "扣非净利润滚动环比增长率上年同期",
        process: processors.toPercent
    },
    "TOTALOPERATEREVETZ": {
        name: "营业总收入同比增长率",
        process: processors.toPercent
    },
    "TOTALOPERATEREVETZ_LAST": {
        name: "营业总收入同比增长率上年同期",
        process: processors.toPercent
    },
    "PARENTNETPROFITTZ": {
        name: "归属净利润同比增长率",
        process: processors.toPercent
    },
    "PARENTNETPROFITTZ_LAST": {
        name: "归属净利润同比增长率上年同期",
        process: processors.toPercent
    },
    "TOTAL_SHARE": {
        name: "总股本",
        process: processors.toSmartAmount
    },
    "FREE_SHARE": {
        name: "流通股本",
        process: processors.toSmartAmount
    },
    "EPSJB_PL": {
        name: "基本每股收益披露值",
        process: processors.toYuan
    },
    "BPS_PL": {
        name: "每股净资产披露值",
        process: processors.toYuan
    },
    "FORMERNAME": { name: "曾用名" },
    "EQUITY_NEW_REPORT": {
        name: "最新净资产",
        process: processors.toSmartAmount
    },
    "PE_DYNAMIC": {
        name: "市盈率动",
        process: processors.toBei
    },
    "PE_STATIC": {
        name: "市盈率静",
        process: processors.toBei
    },
    "PE_TTM": {
        name: "市盈率TTM",
        process: processors.toBei
    },
    "PB_NEW_NOTICE": {
        name: "市净率",
        process: processors.toBei
    },
    "TOTAL_MARKET_CAP": {
        name: "总市值",
        process: processors.toSmartAmount
    },
    "PB_MRQ_REALTIME": {
        name: "市净率实时",
        process: processors.toBei
    }
};

// 合并财务数据、指标数据和价格数据
function mergeStockData(
  financialData: FinancialDataResponse,
  indicatorData: IndicatorDataResponse,
  currentPrice: number
): Record<string, any> {
  const financialItem = financialData.result.data[0];
  const indicatorItem = indicatorData.result.data[0];

  // 转换财务数据为中文并格式化
  const convertedFinancial = convertFieldsToChinese(financialItem, aStockFieldConfig);

  // 转换指标数据为中文并格式化
  const convertedIndicator = convertFieldsToChinese(indicatorItem, aStockFieldConfig);

    // 创建整合的股票财务信息对象
    const stockInfo = {
        当前价格: processors.toYuan(currentPrice),
        ...convertedFinancial,
        ...convertedIndicator,
    };

  return stockInfo;
}


export async function handleAStockData({ code, plainCode, market }: { code: string, plainCode: string, market: number }): Promise<Record<string, any>> {
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
