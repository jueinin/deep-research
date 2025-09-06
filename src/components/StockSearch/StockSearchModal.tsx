"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { Modal, Select, Button, Spin, message, Collapse } from "antd";
import { map, get, find, flow, split } from "lodash/fp";
import { useTaskStore } from "@/store/task";
import { request } from "@/utils/request";
import dayjs from "dayjs";
import useDebounceValue from "@/hooks/useDebounceValue";
import type {
  StockSearchResult,
  StockSearchResponse,
  StockFinancialInfo,
  StockFinancialInfoResponse
} from "@/types/stock";
import { isNil } from "lodash";

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
export default function StockSearchModal({ open, onClose }: StockSearchModalProps) {
  const { question, setQuestion } = useTaskStore();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounceValue(searchValue, 300)
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["stockSearch", debouncedSearchValue],
    queryFn: async () => request<StockSearchResponse>({
      url: `/api/search/eastmoney/search-stock-by-name?keyword=${encodeURIComponent(debouncedSearchValue)}`
    }),
    enabled: debouncedSearchValue.trim().length > 0,
  });


  const getFinancialInfoMutation = useMutation({
    mutationFn: async ({ stockCodeWithSuffix }: { stockCode: string; stockCodeWithSuffix: string }) =>
      request<StockFinancialInfoResponse>({
        url: `/api/search/eastmoney/get-stock-financial-info?code=${stockCodeWithSuffix}`
      }),
  });

  const { mutate, data: financialData, isPending } = getFinancialInfoMutation;

  const handleInsert = () => {
    const replacedText = generateReplacedText(financialData?.data!, question);
    setQuestion(replacedText);
    onClose();
  };
  return (
    <Modal
      title="股票搜索"
      open={open}
      destroyOnHidden
      width={900}
      onCancel={onClose}
      okText={'插入'}
      onOk={handleInsert}
      okButtonProps={{ disabled: !!financialData }}
    >
      <div className="mb-4">
        <Select
          placeholder="请输入股票名称"
          style={{ width: '100%' }}
          size="large"
          showSearch
          searchValue={searchValue}
          onSearch={setSearchValue}
          loading={isLoading}
          options={searchData?.result?.map(stock => ({
            label: <div>
              <div>{stock.shortName} ({stock.code})</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{stock.securityTypeName}</div>
            </div>,
            value: stock.code,
            item: stock
          }))}
          filterOption={false}
          onChange={(stockCode, opt) => {
            const option = opt as OptionType
            mutate({ stockCode, stockCodeWithSuffix: formatStockCode(option.item) })
          }}
        >
        </Select>
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
                        {match(formatFinancialValue(key, value) as string)
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
                          .with('-', () => <span className="text-gray-400 text-sm">-</span>)
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
    </Modal>
  );
}

const formatStockCode = (record: StockSearchResult): string => {
  const { code, securityTypeName } = record;
  return match(securityTypeName)
    .with("深A", () => `${code}.SZ`)
    .with("沪A", "科创板", () => `${code}.SH`)
    .with("京A", "三板", () => `${code}.BJ`)
    .otherwise(() => code);
};

const generateReplacedText = (
  financialData: StockFinancialInfo,
  template: string
) => {
  const financialTable = generateFinancialTable(financialData);
  const replacements = {
    '股票名称': financialData.证券简称,
    '市盈率TTM': getFinancialValue(financialData, '市盈率TTM' as keyof StockFinancialInfo),
    '财务数据表格': financialTable,
    currentDate: dayjs().format('YYYY-MM-DD'),
    当前股价: String(financialData.当前价格)
  };
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
};

const getFinancialValue = (financialData: StockFinancialInfo, key: keyof StockFinancialInfo): string => {
  const value = financialData[key];
  if (isNil(value)) return "-";
  return formatFinancialValue(key as string, value);
};

const generateFinancialTable = (financialData: StockFinancialInfo): string => {
  const importantKeys = [
    '证券简称', '报告日期', '报告类型',
    '基本每股收益', '扣非每股收益', '稀释每股收益',
    '每股净资产', '每股公积金', '每股未分配利润', '每股经营现金流',
    '营业总收入', '营业总收入上年同期', '归属净利润', '归属净利润上年同期',
    '加权净资产收益率', '加权净资产收益率上年同期',
    '毛利率', '毛利率上年同期', '资产负债率', '资产负债率上年同期',
    '营业总收入同比增长率', '归属净利润同比增长率',
    '总股本', '流通股本',
    '市盈率动', '市盈率静', '市盈率TTM', '市净率', '总市值'
  ];
  const tableHeader = "| 指标名称 | 数值 |\n| --- | --- |\n";
  const tableRows = importantKeys
    .filter(key => financialData[key as keyof StockFinancialInfo] !== null &&
      financialData[key as keyof StockFinancialInfo] !== undefined)
    .map(key => `| ${key} | ${formatFinancialValue(key, financialData[key as keyof StockFinancialInfo])} |`)
    .join('\n');
  return tableHeader + tableRows;
};

const formatFinancialValue = (key: string, value: any): string => {
  if (typeof value !== 'number') {
    return typeof value === 'string' && key.includes('日期')
      ? value.split(' ')[0] // 只显示日期部分
      : String(value);
  }

  return match(key)
    // 处理市盈率、市净率等比率 - 这些应该显示为倍数
    .when(k => k.includes('市盈率') || k.includes('市净率') || k.includes('PE') || k.includes('PB'),
      () => `${value.toFixed(2)}倍`)
    // 处理百分比数据 - 后端已经返回百分比值，不需要再乘以100
    // 但要排除市盈率、市净率等，因为它们虽然名字里有"率"但实际上是倍数
    .when(k => (k.includes('率') || k.includes('比') || k.includes('收益率') || k.includes('ROE') || k.includes('ROA')) &&
      !k.includes('市盈率') && !k.includes('市净率'),
      () => `${value.toFixed(2)}%`)
    // 处理每股数据
    .when(k => k.includes('每股'),
      () => `${value.toFixed(2)}元`)
    // 处理金额数据（单位：元）
    .when(k => k.includes('收入') || k.includes('利润') || k.includes('资产') || k.includes('市值') || k.includes('净资产') || k.includes('股本'),
      () => {
        if (Math.abs(value) >= 100000000) {
          return `${(value / 100000000).toFixed(2)}亿`;
        } else if (Math.abs(value) >= 10000) {
          return `${(value / 10000).toFixed(2)}万`;
        } else {
          return `${value.toFixed(2)}元`;
        }
      })
    // 默认情况
    .otherwise(() => value.toFixed(2));
};