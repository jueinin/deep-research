import axios from "axios";

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

export const apiClient = axios.create({
  headers,
  timeout: 10000,
});

export const processors = {
    toFixed2: (value: any) => typeof value === "number" ? value.toFixed(2) : value,
    toFixed4: (value: any) => typeof value === "number" ? value.toFixed(4) : value,
    toPercent: (value: any) => typeof value === "number" ? value.toFixed(2) + "%" : value,
    toPercentWithFilter: (value: any) => {
        if (typeof value !== "number") return null;
        if (value >= 99) return null;
        return value.toFixed(2) + "%";
    },
    toHundredMillion: (value: any) => typeof value === "number" ? (value / 100000000).toFixed(2) + "亿" : value,
    toTenThousand: (value: any) => typeof value === "number" ? (value / 10000).toFixed(2) + "万" : value,
    handleNull: (value: any) => value === null || value === undefined ? "--" : value,
    toYuan: (value: any) => typeof value === "number" ? value.toFixed(2) + "元" : value,
    toBei: (value: any) => typeof value === "number" ? value.toFixed(2) + "倍" : value,
    toSmartAmount: (value: any) => {
        if (typeof value !== 'number') return processors.handleNull(value);
        if (Math.abs(value) >= 100000000) return processors.toHundredMillion(value);
        if (Math.abs(value) >= 10000) return processors.toTenThousand(value);
        return processors.toYuan(value);
    }
};

// 字段处理配置类型
export type FieldProcessor = {
  name: string;
  process?: (value: any) => string | null;
};

// 解析JSONP数据
export function parseJsonpData(jsonpData: string): any {
  const firstIndex = jsonpData.indexOf('(');
  const lastIndex = jsonpData.lastIndexOf(')');
  const json = jsonpData.slice(firstIndex + 1, lastIndex);
  return JSON.parse(json);
}

export function convertFieldsToChinese<T>(
  item: T,
  fieldConfig: Record<string, FieldProcessor>
): Record<string, any> {
  const convertedItem: Record<string, any> = {};

  for (const [key, value] of Object.entries(item as any)) {
    const config = fieldConfig[key];
    if (config) {
      const chineseKey = config.name;
      let processedValue;
      if (config.process) {
        processedValue = config.process(value);
      } else {
        processedValue = processors.handleNull(value);
      }
      
      if (processedValue !== null && processedValue !== undefined && processedValue !== '--') {
        convertedItem[chineseKey] = processedValue;
      }
    }
  }

  return convertedItem;
}
