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

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const pageIndex = searchParams.get("pageIndex") || "1";
  const pageSize = searchParams.get("pageSize") || "5";

  if (!keyword) {
    return NextResponse.json(
      { code: 400, message: "股票名称关键词不能为空" },
      { status: 400 }
    );
  }

  try {
    // 生成随机回调函数名和时间戳，模拟jQuery JSONP请求
    const callback = `jQuery${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const timestamp = Date.now();

    // 构建东方财富API请求URL
    const baseUrl = "https://search-codetable.eastmoney.com/codetable/search/web";
    const url = `${baseUrl}?client=web&clientType=webSuggest&clientVersion=lastest&cb=${callback}&keyword=${encodeURIComponent(keyword)}&pageIndex=${pageIndex}&pageSize=${pageSize}&securityFilter=&_=${timestamp}`;

    const headers = {
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "Connection": "keep-alive",
      "Referer": "https://www.eastmoney.com/",
      "Sec-Fetch-Dest": "script",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"'
    };

    // 发送请求
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`东方财富搜索API请求失败: ${response.status} ${response.statusText}`);
    }

    // 获取响应文本
    const responseText = await response.text();

    // 解析JSONP响应，提取JSON数据
    // JSONP格式: callbackName({...json data...})
    const jsonStart = responseText.indexOf("(");
    const jsonEnd = responseText.lastIndexOf(")");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("无法解析东方财富API响应格式");
    }

    const jsonString = responseText.substring(jsonStart + 1, jsonEnd);
    const data = JSON.parse(jsonString);

    // 返回解析后的数据
    return NextResponse.json(data);
  } catch (error) {
    console.error("搜索股票失败:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { code: 500, message: "搜索股票失败" },
      { status: 500 }
    );
  }
}