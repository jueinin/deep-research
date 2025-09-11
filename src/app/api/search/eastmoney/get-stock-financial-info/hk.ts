import { PriceData } from "@/types/stock";
import { apiClient, processors, convertFieldsToChinese, FieldProcessor } from "./common";

// 港股所有字段配置
const hkFieldConfig: Record<string, FieldProcessor> = {
  // 价格字段
  "f43": {
    name: "当前价格",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "港元" : processors.handleNull(value)
  },
  
  // 基本信息
  "SECUCODE": {
    name: "证券代码"
  },
  "SECURITY_CODE": {
    name: "股票代码"
  },
  "SECURITY_NAME_ABBR": {
    name: "证券简称"
  },
  "REPORT_DATE": {
    name: "报告日期",
    process: (value: any) => typeof value === 'string' && value.includes(' ') ? value.split(' ')[0] : String(value)
  },
  "REPORT_TYPE": {
    name: "报告类型"
  },
  "CURRENCY": {
    name: "币种"
  },
  
  // 每股指标
  "BASIC_EPS": {
    name: "基本每股收益",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "元" : processors.handleNull(value)
  },
  "PER_NETCASH_OPERATE": {
    name: "每股经营现金流",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "元" : processors.handleNull(value)
  },
  "BPS": {
    name: "每股净资产",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "元" : processors.handleNull(value)
  },
  "DIVIDEND_TTM": {
    name: "每股股息TTM",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "港元" : processors.handleNull(value)
  },
  "DIVIDEND_LFY": {
    name: "上年每股股息",
    process: (value: any) => typeof value === 'number' ? value.toFixed(2) + "港元" : processors.handleNull(value)
  },
  
  // 股本信息
  "COMMON_ACS": {
    name: "法定股本",
    process: processors.toSmartAmount
  },
  "PER_SHARES": {
    name: "每手股数"
  },
  "ISSUED_COMMON_SHARES": {
    name: "已发行股本",
    process: processors.toSmartAmount
  },
  "HK_COMMON_SHARES": {
    name: "港股股本",
    process: processors.toSmartAmount
  },
  
  // 市值
  "TOTAL_MARKET_CAP": {
    name: "总市值",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "港元" : processors.handleNull(value)
  },
  "HKSK_MARKET_CAP": {
    name: "港股市值",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "港元" : processors.handleNull(value)
  },
  
  // 营收利润
  "OPERATE_INCOME": {
    name: "营业总收入",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "OPERATE_INCOME_SQ": {
    name: "营业总收入上年同期",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "HOLDER_PROFIT": {
    name: "净利润",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "HOLDER_PROFIT_SQ": {
    name: "净利润上年同期",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "OPERATE_PROFIT": {
    name: "营业利润",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "PRETAX_PROFIT": {
    name: "税前利润",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  
  // 增长率
  "OPERATE_INCOME_QOQ": {
    name: "营业总收入环比增长率",
    process: processors.toPercent
  },
  "OPERATE_INCOME_QOQ_SQ": {
    name: "营业总收入环比增长率上年同期",
    process: processors.toPercent
  },
  "HOLDER_PROFIT_QOQ": {
    name: "净利润环比增长率",
    process: processors.toPercent
  },
  "HOLDER_PROFIT_QOQ_SQ": {
    name: "净利润环比增长率上年同期",
    process: processors.toPercent
  },
  
  // 估值指标
  "PE_TTM": {
    name: "市盈率TTM",
    process: processors.toBei
  },
  "PE_TTM_SQ": {
    name: "市盈率TTM上年同期",
    process: processors.toBei
  },
  "PB_TTM": {
    name: "市净率TTM",
    process: processors.toBei
  },
  "PB_TTM_SQ": {
    name: "市净率TTM上年同期",
    process: processors.toBei
  },
  
  // 财务比率
  "NET_PROFIT_RATIO": {
    name: "销售净利率",
    process: processors.toPercent
  },
  "NET_PROFIT_RATIO_SQ": {
    name: "销售净利率上年同期",
    process: processors.toPercent
  },
  "ROE_AVG": {
    name: "股东权益回报率",
    process: processors.toPercent
  },
  "ROE_AVG_SQ": {
    name: "股东权益回报率上年同期",
    process: processors.toPercent
  },
  "ROA": {
    name: "总资产回报率",
    process: processors.toPercent
  },
  "ROA_SQ": {
    name: "总资产回报率上年同期",
    process: processors.toPercent
  },
  "DIVI_RATIO": {
    name: "派息比率",
    process: processors.toPercent
  },
  "DIVIDEND_RATE": {
    name: "股息率TTM",
    process: processors.toPercent
  },
  
  // 资产负债
  "TOTAL_ASSETS": {
    name: "总资产",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "TOTAL_LIABILITIES": {
    name: "总负债",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "TOTAL_PARENT_EQUITY": {
    name: "股东权益",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  
  // 现金流
  "NETCASH_OPERATE": {
    name: "经营活动现金流",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "NETCASH_INVEST": {
    name: "投资活动现金流",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "NETCASH_FINANCE": {
    name: "筹资活动现金流",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  },
  "END_CASH": {
    name: "期末现金",
    process: (value: any) => typeof value === 'number' ? processors.toSmartAmount(value) + "元" : processors.handleNull(value)
  }
};


export async function handleHKStockData({ code, plainCode, market }: { code: string, plainCode: string, market: number }): Promise<Record<string, any>> {
  const priceBaseUrl = "https://push2.eastmoney.com/api/qt/stock/get";
  const mainIndicatorBaseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get";
  
  const priceParams = {
    fields: "f43",
    secid: `${market}.${plainCode}`,
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fltt: "2",
    wbp2u: "|0|0|0|web",
    v: Date.now()
  };

  const mainIndicatorColumns = "ORG_CODE,SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,SECURITY_INNER_CODE,REPORT_DATE,BASIC_EPS,PER_NETCASH_OPERATE,BPS,BPS_NEDILUTED,COMMON_ACS,PER_SHARES,ISSUED_COMMON_SHARES,HK_COMMON_SHARES,TOTAL_MARKET_CAP,HKSK_MARKET_CAP,OPERATE_INCOME,OPERATE_INCOME_SQ,OPERATE_INCOME_QOQ,OPERATE_INCOME_QOQ_SQ,HOLDER_PROFIT,HOLDER_PROFIT_SQ,HOLDER_PROFIT_QOQ,HOLDER_PROFIT_QOQ_SQ,PE_TTM,PE_TTM_SQ,PB_TTM,PB_TTM_SQ,NET_PROFIT_RATIO,NET_PROFIT_RATIO_SQ,ROE_AVG,ROE_AVG_SQ,ROA,ROA_SQ,DIVIDEND_TTM,DIVIDEND_LFY,DIVI_RATIO,DIVIDEND_RATE,IS_CNY_CODE";
  
  const mainIndicatorParams = {
    reportName: "RPT_CUSTOM_HKF10_FN_MAININDICATORMAX",
    columns: mainIndicatorColumns,
    quoteColumns: "",
    filter: `(SECUCODE="${code}")`,
    pageNumber: "1",
    pageSize: "1",
    sortTypes: "-1",
    sortColumns: "REPORT_DATE",
    source: "F10",
    client: "PC",
    v: Date.now()
  };

  const detailedIndicatorParams = {
    reportName: "RPT_HKF10_FN_MAININDICATOR",
    columns: "HKF10_FN_MAININDICATOR_DATA",
    quoteColumns: "",
    filter: `(SECUCODE="${code}")`,
    pageNumber: "1",
    pageSize: "1",
    sortTypes: "-1",
    sortColumns: "STD_REPORT_DATE",
    source: "F10",
    client: "PC",
    v: Date.now()
  };

  const [priceResponse, mainIndicatorResponse, detailedIndicatorResponse] = await Promise.all([
    apiClient.get<PriceData>(priceBaseUrl, { params: priceParams }),
    apiClient.get(mainIndicatorBaseUrl, { params: mainIndicatorParams }).catch(() => null),
    apiClient.get(mainIndicatorBaseUrl, { params: detailedIndicatorParams }).catch(() => null)
  ]);
   const result = Object.assign({},
     convertFieldsToChinese(priceResponse.data.data || {}, hkFieldConfig),
     convertFieldsToChinese(mainIndicatorResponse?.data?.result?.data?.[0] || {}, hkFieldConfig),
     convertFieldsToChinese(detailedIndicatorResponse?.data?.result?.data?.[0] || {}, hkFieldConfig)
   )
  return result;
}