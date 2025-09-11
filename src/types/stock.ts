// 股票价格数据类型
export interface PriceData {
  rc: number;
  rt: number;
  svr: number;
  lt: number;
  full: number;
  dlmkts: string;
  data: {
    f43: number; // 当前价格
    f44: number; // 最高价
    f45: number; // 最低价
    f46: number; // 今开价
    f47: number; // 成交量
    f48: number; // 成交额
    f50: number; // 换手率
    f57: string; // 证券代码
    f58: string; // 证券名称
    f60: number; // 昨收价
    f164: number; // 市盈率TTM
    f168: number; // 市净率
    f169: number; // 总股本
    f170: number; // 流通股本
    f171: number; // 市值
  };
}

// 财务数据项类型
export interface FinancialDataItem {
  SECUCODE: string;
  SECURITY_CODE: string;
  SECURITY_NAME_ABBR: string;
  REPORT_DATE: string;
  REPORT_TYPE: string;
  EPSJB: number; // 基本每股收益
  EPSKCJB: number; // 扣非每股收益
  EPSXS: number; // 稀释每股收益
  BPS: number; // 每股净资产
  MGZBGJ: number; // 每股公积金
  MGWFPLR: number; // 每股未分配利润
  MGJYXJJE: number; // 每股经营现金流
  TOTAL_OPERATEINCOME: number; // 营业总收入
  TOTAL_OPERATEINCOME_LAST: number; // 营业总收入上年同期
  PARENT_NETPROFIT: number; // 归属净利润
  PARENT_NETPROFIT_LAST: number; // 归属净利润上年同期
  ROEJQ: number; // 加权净资产收益率
  ROEJQ_LAST: number; // 加权净资产收益率上年同期
  XSMLL: number; // 毛利率
  XSMLL_LAST: number; // 毛利率上年同期
  ZCFZL: number; // 资产负债率
  ZCFZL_LAST: number; // 资产负债率上年同期
  YYZSRGDHBZC_LAST: number; // 营业总收入滚动环比增长率上年同期
  YYZSRGDHBZC: number; // 营业总收入滚动环比增长率
  NETPROFITRPHBZC: number; // 归属净利润滚动环比增长率
  NETPROFITRPHBZC_LAST: number; // 归属净利润滚动环比增长率上年同期
  KFJLRGDHBZC: number; // 扣非净利润滚动环比增长率
  KFJLRGDHBZC_LAST: number; // 扣非净利润滚动环比增长率上年同期
  TOTALOPERATEREVETZ: number; // 营业总收入同比增长率
  TOTALOPERATEREVETZ_LAST: number; // 营业总收入同比增长率上年同期
  PARENTNETPROFITTZ: number; // 归属净利润同比增长率
  PARENTNETPROFITTZ_LAST: number; // 归属净利润同比增长率上年同期
  TOTAL_SHARE: number; // 总股本
  FREE_SHARE: number; // 流通股本
  EPSJB_PL: number; // 基本每股收益披露值
  BPS_PL: number; // 每股净资产披露值
  FORMERNAME: string | null; // 曾用名
}

// 财务数据响应类型
export interface FinancialDataResponse {
  version: string;
  result: {
    pages: number;
    data: FinancialDataItem[];
    count: number;
  };
  success: boolean;
  message: string;
  code: number;
}

// 指标数据项类型
export interface IndicatorDataItem {
  SECURITY_CODE: string;
  SECUCODE: string;
  EQUITY_NEW_REPORT: number; // 最新净资产
  PE_DYNAMIC: number; // 市盈率动
  PE_STATIC: number; // 市盈率静
  PE_TTM: number; // 市盈率TTM
  PB_NEW_NOTICE: number; // 市净率
  TOTAL_MARKET_CAP: number; // 总市值
  PB_MRQ_REALTIME: number; // 市净率实时
}

// 指标数据响应类型
export interface IndicatorDataResponse {
  version: string;
  result: {
    pages: number;
    data: IndicatorDataItem[];
    count: number;
  };
  success: boolean;
  message: string;
  code: number;
}

// 整合后的股票财务信息类型
export interface StockFinancialInfo {
  // 基本信息
  证券统一代码: string;
  证券代码: string;
  证券简称: string;
  报告日期: string;
  报告类型: string;
  曾用名: string | null;
  
  // 每股指标
  基本每股收益: number;
  扣非每股收益: number;
  稀释每股收益: number;
  每股净资产: number;
  每股公积金: number;
  每股未分配利润: number;
  每股经营现金流: number;
  基本每股收益披露值: number;
  每股净资产披露值: number;
  
  // 收入利润
  营业总收入: number;
  营业总收入上年同期: number;
  归属净利润: number;
  归属净利润上年同期: number;
  
  // 收益率
  加权净资产收益率: number;
  加权净资产收益率上年同期: number;
  
  // 比率指标
  毛利率: number;
  毛利率上年同期: number;
  资产负债率: number;
  资产负债率上年同期: number;
  
  // 增长率
  营业总收入滚动环比增长率: number;
  营业总收入滚动环比增长率上年同期: number;
  归属净利润滚动环比增长率: number;
  归属净利润滚动环比增长率上年同期: number;
  扣非净利润滚动环比增长率: number;
  扣非净利润滚动环比增长率上年同期: number;
  营业总收入同比增长率: number;
  营业总收入同比增长率上年同期: number;
  归属净利润同比增长率: number;
  归属净利润同比增长率上年同期: number;
  
  // 股本信息
  总股本: number;
  流通股本: number;
  
  // 估值指标
  最新净资产: number;
  市盈率动: number;
  市盈率静: number;
  市盈率TTM: number;
  市净率: number;
  总市值: number;
  市净率实时: number;
  
  // 价格信息
  当前价格: number;
  [index: string]: any
}

// API响应类型
export interface StockFinancialInfoResponse {
  success: boolean;
  message: string;
  code: number;
  data: Record<string, any>;
}

// 股票搜索结果类型
export interface StockSearchResult {
  code: string;
  innerCode: string;
  shortName: string;
  market: number;
  pinyin: string;
  securityType: number[];
  securityTypeName: string;
  smallType: number;
  status: number;
  flag: number;
  extSmallType: number;
}

// 股票搜索响应类型
export interface StockSearchResponse {
  code: string;
  msg: string;
  pageIndex: number;
  pageSize: number;
  result: StockSearchResult[];
  searchId: string;
}

// 国债收益率代码类型
export type TreasuryCode = 'cn10y' | 'us10y';

// 国债收益率响应类型 - 简化为直接返回格式化后的百分比字符串
export interface TreasuryYieldResponse {
  cn10y?: string;  // 例如: "1.8198%"
  us10y?: string;  // 例如: "4.0606%"
}