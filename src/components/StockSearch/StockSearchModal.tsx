"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { Modal, Select, Spin, Collapse, Tag, Button, Radio } from "antd";
import { useTaskStore } from "@/store/task";
import { request } from "@/utils/request";
import dayjs from "dayjs";
import useDebounceValue from "@/hooks/useDebounceValue";
import { useLocalStorage } from 'react-use'
import type {
  StockSearchResult,
  StockSearchResponse,
  StockFinancialInfoResponse
} from "@/types/stock";
import { HistoryOutlined } from "@ant-design/icons";
import { shortPrompt, longPrompt } from "./defaultPrompt";

const { Panel } = Collapse;
interface StockSearchModalProps {
  open: boolean;
  onClose: () => void;
}
type OptionType = {
  label: React.ReactNode,
  value: string,
  item: StockSearchResult
}
type FinancialDataVariables = {
  stockCodeWithSuffix: string;
  market: number;
}
export default function StockSearchModal({ open, onClose }: StockSearchModalProps) {
  const { question, setQuestion } = useTaskStore();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounceValue(searchValue, 300);
  const { history, addSearch, removeSearch, clearHistory } = useStockSearchHistory();
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [promptType, setPromptType] = useState<'short' | 'long'>('short');
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["stockSearch", debouncedSearchValue],
    queryFn: async () => request<StockSearchResponse>({
      url: `/api/search/eastmoney/search-stock-by-name?keyword=${encodeURIComponent(debouncedSearchValue)}`
    }),
    enabled: debouncedSearchValue.trim().length > 0,
  });

  const { mutate, data: financialData, isPending, variables: financialDataVariables } = useMutation({
    mutationFn: async ({ stockCodeWithSuffix, market }: FinancialDataVariables) => request<StockFinancialInfoResponse>({
      url: `/api/search/eastmoney/get-stock-financial-info`,
      params: {
        code: stockCodeWithSuffix,
        market
      }
    }),
  });

  return (
    <Modal
      title="股票搜索"
      open={open}
      destroyOnHidden
      width={900}
      onCancel={onClose}
      okText={'插入'}
      onOk={() => {
        if (!question || !hasVariablesToReplace(question)) {
          setPromptModalVisible(true);
        } else {
          const replacedText = generateReplacedText(financialData?.data!, question, financialDataVariables?.market || 0);
          setQuestion(replacedText);
          onClose();
        }
      }}
      okButtonProps={{ disabled: !financialData }}
    >
      <div className="mb-4">
        <Select
          placeholder="请输入股票名称"
          className="w-full"
          showSearch
          searchValue={searchValue}
          onSearch={setSearchValue}
          loading={isLoading}
          optionRender={({ data: { item } }) => <>
            <div>{item.shortName} ({item.code})</div>
            <div className="text-[12px] color-[#999000]">{item.securityTypeName}</div>
          </>}
          options={searchData?.result?.map(stock => ({
            label: stock.shortName,
            value: stock.innerCode,
            key: stock.innerCode,
            item: stock
          }))}
          filterOption={false}
          onChange={(_stockCode, opt) => {
            const option = opt as OptionType
            addSearch({
              id: `${option.item.code}-${Date.now()}`,
              stock: option.item,
              searchTime: Date.now(),
              searchQuery: searchValue,
            });
            mutate({
              stockCodeWithSuffix: formatStockCode(option.item),
              market: option.item.market
            })
          }}
        >
        </Select>

        {!searchValue && history.length > 0 && !financialData && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HistoryOutlined className="text-gray-500 text-sm" />
                <span className="text-xs text-gray-500">最近搜索</span>
              </div>
              <Button
                size="small"
                type="text"
                className="text-xs h-auto p-0"
                onClick={clearHistory}
              >
                清空
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 8).map((item) => <Tag
                key={item.id}
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                closable
                onClose={(e) => {
                  e.preventDefault();
                  removeSearch(item.id);
                }}
                onClick={() => {
                  mutate({
                    stockCodeWithSuffix: formatStockCode(item.stock),
                    market: item.stock.market
                  });
                }}
              >
                {item.stock.shortName}
              </Tag>)}
            </div>
          </div>
        )}
      </div>

      {isPending && (
        <div className="text-center py-8">
          <Spin size="large" tip="获取财务数据中..." />
        </div>
      )}

      {financialData?.data && (
        <div className="mt-4">
          <Collapse defaultActiveKey={['1']} className="mb-4">
            <Panel header="财务数据" key="1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-2">
                  {Object.entries(financialData.data).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium tracking-wide uppercase truncate">
                        {key}
                      </div>
                      <div className="text-base font-bold">
                        {match(String(value))
                          .with(P.string.includes('%'), value => <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                          .with(P.string.includes('亿'), value => <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                          .with(P.string.includes('万'), value => <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                          .with(P.string.includes('元'), value => <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                          .with(P.string.includes('倍'), value => <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                          .with('--', () => <span className="text-gray-400 text-sm">--</span>)
                          .otherwise(value => <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full text-xs">
                            {value}
                          </span>)
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </Collapse>
        </div>
      )}

      {/* Prompt 选择弹窗 */}
      <Modal
        title="选择 Prompt 类型"
        open={promptModalVisible}
        onCancel={() => setPromptModalVisible(false)}
        onOk={() => {
          const selectedPrompt = promptType === 'long' ? longPrompt : shortPrompt;
          const replacedText = generateReplacedText(financialData?.data!, selectedPrompt, financialDataVariables?.market || 0);
          setQuestion(replacedText);
          setPromptModalVisible(false);
          onClose();
        }}
      >
        <Radio.Group value={promptType} onChange={(e) => setPromptType(e.target.value)}>
          <Radio value="short">短 Prompt</Radio>
          <Radio value="long">长 Prompt</Radio>
        </Radio.Group>
      </Modal>
    </Modal>
  );
}

// 定义所有可用的变量
const AVAILABLE_VARIABLES = [
  '股票名称',
  '市盈率TTM',
  '财务数据表格',
  'currentDate',
  '当前股价',
  'market'
] as const;

const formatStockCode = (record: StockSearchResult): string => {
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
    .otherwise(() => code);
};

// 检查模板中是否有需要替换的变量
const hasVariablesToReplace = (template: string): boolean => {
  const variablePattern = /{{\s*([^}\s]+)\s*}}/g;
  let match;
  while ((match = variablePattern.exec(template)) !== null) {
    if (AVAILABLE_VARIABLES.includes(match[1] as typeof AVAILABLE_VARIABLES[number])) {
      return true;
    }
  }
  return false;
};

const generateReplacedText = (
  financialData: Record<string, any>,
  template: string,
  market: number
) => {
  const financialTable = generateFinancialTable(financialData);
  const replacements: Record<typeof AVAILABLE_VARIABLES[number], string> = {
    '股票名称': financialData.证券简称 || '--',
    '市盈率TTM': financialData.市盈率TTM || '--',
    '财务数据表格': financialTable,
    currentDate: dayjs().format('YYYY-MM-DD'),
    market: match(market)
      .with(105, 106, 107, () => '美股')
      .with(0, 1, () => 'A股')
      .run(),
    当前股价: financialData.当前价格 || '--'
  };
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
};

const generateFinancialTable = (financialData: Record<string, any>): string => {
  const tableHeader = "| 指标名称 | 数值 |\n| --- | --- |\n";
  const tableRows = Object.entries(financialData)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '--')
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
  return tableHeader + tableRows;
};

const useStockSearchHistory = () => {
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

interface StockSearchHistoryItem {
  id: string;
  stock: StockSearchResult;
  searchTime: number;
  searchQuery: string;
}
