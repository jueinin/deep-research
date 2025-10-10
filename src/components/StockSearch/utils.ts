import { match } from "ts-pattern";
import { useLocalStorage } from 'react-use';
import dayjs from "dayjs";
import type { StockSearchResult, TreasuryYieldResponse } from "@/types/stock";

// 类型定义
export type OptionType = {
  label: React.ReactNode;
  value: string;
  item: StockSearchResult;
};

export type FinancialDataVariables = {
  stockCodeWithSuffix: string;
  market: number;
};

export interface StockSearchHistoryItem {
  id: string;
  stock: StockSearchResult;
  searchTime: number;
  searchQuery: string;
}

// 定义所有可用的变量
export const AVAILABLE_VARIABLES = [
  '股票名称',
  '市盈率TTM',
  '财务数据表格',
  'currentDate',
  '当前股价',
  'market',
  'cn10y',
  'us10y',
  '成本价建议'
] as const;

// 工具函数
export const formatStockCode = (record: StockSearchResult): string => {
  const { code, securityTypeName, market } = record;
  return match(securityTypeName)
    .with("深A", () => `${code}.SZ`)
    .with("沪A", "科创板", () => `${code}.SH`)
    .with("京A", "三板", () => `${code}.BJ`)
    .with('美股', () => `${code}.${match(market)
      .with(105, () => 'O')
      .with(106, () => 'N')
      .with(107, () => 'A')
      .run()}`)
    .with('港股', () => `${code}.HK`)
    .otherwise(() => code);
};

// 检查模板中是否有需要替换的变量
export const hasVariablesToReplace = (template: string): boolean => {
  const variablePattern = /{{\s*([^}\s]+)\s*}}/g;
  let match;
  while ((match = variablePattern.exec(template)) !== null) {
    if (AVAILABLE_VARIABLES.includes(match[1] as typeof AVAILABLE_VARIABLES[number])) {
      return true;
    }
  }
  return false;
};

export const generateReplacedText = (
  financialData: Record<string, any>,
  template: string,
  market: number,
  treasuryData?: TreasuryYieldResponse,
  costPrice?: string
) => {
  const financialTable = generateFinancialTable(financialData);
  const costPriceSuggestion = costPrice
    ? `- 我的实际成本价是${costPrice}元，不用考虑什么复权分红的，请给出一些建议。`
    : '';
  
  const replacements: Record<typeof AVAILABLE_VARIABLES[number], string> = {
    '股票名称': financialData.证券简称 || '--',
    '市盈率TTM': financialData.市盈率TTM || '--',
    '财务数据表格': financialTable,
    currentDate: dayjs().format('YYYY-MM-DD'),
    market: match(market)
      .with(105, 106, 107, () => '美股')
      .with(0, 1, () => 'A股')
      .with(116, () => '港股')
      .run(),
    当前股价: financialData.当前价格 || '--',
    cn10y: treasuryData?.cn10y || '--',
    us10y: treasuryData?.us10y || '--',
    '成本价建议': costPriceSuggestion
  };
  
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
};

export const generateFinancialTable = (financialData: Record<string, any>): string => {
  const tableHeader = "| 指标名称 | 数值 |\n| --- | --- |\n";
  const tableRows = Object.entries(financialData)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '--')
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
  return tableHeader + tableRows;
};

// 自定义 Hook
export const useStockSearchHistory = () => {
  const [history, setHistory] = useLocalStorage<StockSearchHistoryItem[]>('stockSearchHistory', []);
  
  const addSearch = (item: StockSearchHistoryItem) => {
    setHistory(prevHistory => {
      if (!prevHistory) return [];
      const filteredHistory = prevHistory.filter(
        (historyItem) => historyItem.stock.code !== item.stock.code
      );
      const newHistory = [
        { ...item, searchTime: Date.now() },
        ...filteredHistory.slice(0, 19), // 最多保留20条记录
      ];
      return newHistory;
    });
  };

  const removeSearch = (id: string) => {
    setHistory(prevHistory => {
      if (!prevHistory) return [];
      return prevHistory.filter(item => item.id !== id);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history: history || [],
    addSearch,
    removeSearch,
    clearHistory,
  };
};
