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
    timeout: 10000, // 10秒超时
});
export const processors = {
    // 保留两位小数
    toFixed2: (value: any) => typeof value === "number" ? value.toFixed(2) : value,
    // 保留四位小数
    toFixed4: (value: any) => typeof value === "number" ? value.toFixed(4) : value,
    // 转换为百分比
    toPercent: (value: any) => typeof value === "number" ? value.toFixed(2) + "%" : value,
    // 转换为亿单位
    toHundredMillion: (value: any) => typeof value === "number" ? (value / 100000000).toFixed(2) + "亿" : value,
    // 处理空值
    handleNull: (value: any) => value === null || value === undefined ? "--" : value
};

export function parseJsonpData(jsonpData: string): any {
    const firstIndex = jsonpData.indexOf('(')
    const lastIndex = jsonpData.lastIndexOf(')')
    const json = jsonpData.slice(firstIndex+1, lastIndex)
    return JSON.parse(json)
  }