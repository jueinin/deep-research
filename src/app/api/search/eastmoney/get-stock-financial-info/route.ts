import { NextResponse, type NextRequest } from "next/server";

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

// 转换字段名为中文
function convertFieldsToChinese(data: any[]) {
  return data.map(item => {
    const convertedItem: any = {};
    for (const [key, value] of Object.entries(item)) {
      const chineseKey = fieldMapping[key] || key;
      convertedItem[chineseKey] = value;
    }
    return convertedItem;
  });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { code: 400, message: "股票代码不能为空" },
      { status: 400 }
    );
  }

  // 处理股票代码格式
  if (code.includes('.')) {
    // 如果已经包含后缀（如 603993.SH），直接使用
    code = code;
  } else {
    // 如果只有数字（如 603993），添加 .SH 后缀
    code = `${code}.SH`;
  }

  try {
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
    const [financialResponse, indicatorResponse] = await Promise.all([
      fetch(financialUrl, { method: "GET", headers }),
      fetch(indicatorUrl, { method: "GET", headers })
    ]);
    if (!financialResponse.ok) {
      throw new Error(`东方财富财务数据API请求失败: ${financialResponse.status} ${financialResponse.statusText}`);
    }

    if (!indicatorResponse.ok) {
      throw new Error(`东方财富指标数据API请求失败: ${indicatorResponse.status} ${indicatorResponse.statusText}`);
    }

    const financialData = await financialResponse.json();
    const indicatorData = await indicatorResponse.json();
    console.log({financialData, indicatorData, financialUrl})
    // 合并数据
    let mergedData = { ...financialData };
    
    if (financialData.result && financialData.result.data && indicatorData.result && indicatorData.result.data) {
      // 转换财务数据字段名为中文
      const convertedFinancialData = convertFieldsToChinese(financialData.result.data);
      
      // 转换指标数据字段名为中文
      const convertedIndicatorData = convertFieldsToChinese(indicatorData.result.data);
      
      // 合并两个数据对象
      mergedData.result.data = convertedFinancialData.map((financialItem, index) => {
        const indicatorItem = convertedIndicatorData[index] || {};
        return { ...financialItem, ...indicatorItem };
      });
    }
    
    return NextResponse.json(mergedData);
  } catch (error) {
    console.error("获取股票财务信息失败:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { code: 500, message: "获取股票财务信息失败" },
      { status: 500 }
    );
  }
}