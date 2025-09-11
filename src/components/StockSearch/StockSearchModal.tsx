"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal, Select, Spin, Collapse, Tag, Button, Radio } from "antd";
import { useTaskStore } from "@/store/task";
import { request } from "@/utils/request";
import useDebounceValue from "@/hooks/useDebounceValue";
import type {
  StockSearchResponse,
  StockFinancialInfoResponse,
  TreasuryYieldResponse
} from "@/types/stock";
import { HistoryOutlined } from "@ant-design/icons";
import { shortPrompt, longPrompt } from "./defaultPrompt";
import {
  type OptionType,
  type FinancialDataVariables,
  formatStockCode,
  hasVariablesToReplace,
  generateReplacedText,
  useStockSearchHistory
} from "./utils";

interface StockSearchModalProps {
  open: boolean;
  onClose: () => void;
}
export default function StockSearchModal({ open, onClose }: StockSearchModalProps) {
  const { question, setQuestion } = useTaskStore();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounceValue(searchValue, 300);
  const { history, addSearch, removeSearch, clearHistory } = useStockSearchHistory();
  const [promptType, setPromptType] = useState<'short' | 'long'>('short');

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["stockSearch", debouncedSearchValue],
    queryFn: async () => request<StockSearchResponse>({
      url: `/api/search/eastmoney/search-stock-by-name?keyword=${encodeURIComponent(debouncedSearchValue)}`
    }),
    enabled: debouncedSearchValue.trim().length > 0,
  });

  const { data: treasuryData } = useQuery({
    queryKey: ["treasuryYield"],
    queryFn: () => request<TreasuryYieldResponse>({
      url: `/api/search/eastmoney/get-treasury-yield`
    }),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
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
        const selectedPrompt = (!question || !hasVariablesToReplace(question))
          ? (promptType === 'long' ? longPrompt : shortPrompt)
          : question;

        const replacedText = generateReplacedText(
          financialData?.data!,
          selectedPrompt,
          financialDataVariables?.market || 0,
          treasuryData
        );
        setQuestion(replacedText);
        onClose();
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
          <Spin size="large" />
          <div className="mt-2 text-sm text-gray-500">获取财务数据中...</div>
        </div>
      )}

      {financialData?.data && (
        <div className="mt-4">
          <Collapse
            defaultActiveKey={['1']}
            className="mb-4"
            items={[
              {
                key: '1',
                label: '财务数据',
                children: (
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
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full text-xs">
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {financialData?.data && (!question || !hasVariablesToReplace(question)) && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">选择 Prompt 类型：</div>
          <Radio.Group value={promptType} onChange={(e) => setPromptType(e.target.value)}>
            <Radio value="short">短 Prompt</Radio>
            <Radio value="long">长 Prompt</Radio>
          </Radio.Group>
        </div>
      )}
    </Modal>
  );
}
