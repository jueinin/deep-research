import { apiClient } from "./common";
import {processors, parseJsonpData} from './common'
// 字段处理配置类型
type FieldProcessor = {
    name: string;
    process?: (value: any) => string;
};

// 美股字段处理配置
const usStockFieldConfig: Record<string, FieldProcessor> = {
    "SECUCODE": { name: "证券统一代码" },
    "SECURITY_CODE": { name: "证券代码" },
    "SECURITY_NAME_ABBR": { name: "证券简称" },
    "REPORT_DATE": { name: "报告日期" },
    "CURRENCY": { name: "货币" },
    "PE_TTM": {
        name: "市盈率TTM",
        process: processors.toFixed2
    },
    "RATIO_EPS_TTM": {
        name: "每股收益TTM",
        process: processors.toFixed4
    },
    "DPS_USD": {
        name: "每股股息(USD)",
        process: processors.handleNull
    },
    "SALE_GPR": {
        name: "毛利率",
        process: processors.toPercent
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
        name: "市净率MRQ",
        process: processors.toFixed2
    },
    "BVPS": {
        name: "每股净资产",
        process: processors.toFixed4
    },
    "DIVIDEND_RATE": {
        name: "周息率",
        process: processors.handleNull
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
    "SECURITY_INNER_CODE": { name: "证券内部代码" },
    "NET_INTEREST_INCOME": { name: "净利息收入" },
    "LOAN_LOSS_PROVISION": { name: "贷款损失准备" },
    "REINSURE_INCOME": { name: "再保险收入" },
    "COMPENSATE_EXPENSE": { name: "赔付支出" },
    "ORG_TYPE": { name: "机构类型" },
    "SECURITY_TYPE": { name: "证券类型" },
    "CURRENCY_ABBR": { name: "货币简称" },
    "EPS_TTM_CNY": { name: "每股收益TTM(CNY)" },
    "EPS_TTM_USD": { name: "每股收益TTM(USD)" },
    "EPS_TTM_HKD": { name: "每股收益TTM(HKD)" },
    "STD_REPORT_DATE": { name: "标准报告日期" },
};

export async function handleUSStockData({ code, plainCode, market }: { code: string, plainCode: string, market: number }): Promise<Record<string, any>> {
    const baseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get";
    // 美股数据请求参数
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
    
    // 美股价格数据请求参数
    const priceBaseUrl = "https://push2.eastmoney.com/api/qt/stock/get";
    const priceParams = {
        fields: "f57,f58,f43,f60,f169,f170,f171,f168,f47,f48",
        secid: `${market}.${plainCode}`,
        ut: "bd1d9ddb04089700cf9c27f6f7426281",
        fltt: "2",
        cb: `cbrnd_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        v: Date.now()
    };
    try {
        // 并发请求美股数据和价格数据
        const [stockResponse, priceResponse] = await Promise.all([
            apiClient.get(baseUrl, { params: usStockParams }),
            apiClient.get(priceBaseUrl, { params: priceParams, responseType: 'text' })
        ]);
        const stockData = stockResponse.data;
        const priceDataText = priceResponse.data;

        if (!stockData || !stockData.result || !stockData.result.data || !stockData.result.data.length) {
            return {};
        }

        const stockInfo = stockData.result.data[0];
        const convertedData: Record<string, any> = {};

        // 转换字段名为中文并处理格式
        for (const [key, value] of Object.entries(stockInfo)) {
            const fieldConfig = usStockFieldConfig[key];
            
            if (fieldConfig) {
                // 使用配置中的字段名
                const chineseKey = fieldConfig.name;
                
                // 如果配置了处理函数，则使用处理函数
                if (fieldConfig.process) {
                    convertedData[chineseKey] = fieldConfig.process(value);
                } else {
                    // 默认处理：空值转为"--"
                    convertedData[chineseKey] = processors.handleNull(value);
                }
            } else {
                // 没有配置的字段，保留原字段名
                convertedData[key] = processors.handleNull(value);
            }
        }
        
        // 解析价格数据并添加当前价格信息
        const priceData = parseJsonpData(priceDataText);
        return {
          当前价格: priceData.data.f43 ?? '-',
          ...convertedData
        };
    } catch (error) {
        console.error("获取美股数据失败:", error);
        return {};
    }
}