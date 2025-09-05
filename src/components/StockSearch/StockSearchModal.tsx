"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal, Select, Button, Spin, message, Tag, Collapse } from "antd";
const { Panel } = Collapse;
const { Option } = Select;

interface StockSearchResult {
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

interface StockSearchResponse {
  code: string;
  msg: string;
  pageIndex: number;
  pageSize: number;
  result: StockSearchResult[];
  searchId: string;
}

interface StockFinancialInfo {
  [key: string]: any;
}

interface StockSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StockSearchModal({ open, onClose }: StockSearchModalProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [financialData, setFinancialData] = useState<StockFinancialInfo | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["stockSearch", searchValue],
    queryFn: async () => {
      if (!searchValue.trim()) return null;
      
      const response = await fetch(`/api/search/eastmoney/search-stock-by-name?keyword=${encodeURIComponent(searchValue)}`);
      if (!response.ok) {
        throw new Error("搜索失败");
      }
      return response.json() as Promise<StockSearchResponse>;
    },
    enabled: searchValue.trim().length > 0,
  });

  const getFinancialInfoMutation = useMutation({
    mutationFn: async (stockCode: string) => {
      const response = await fetch(`/api/search/eastmoney/get-stock-financial-info?code=${stockCode}`);
      if (!response.ok) {
        throw new Error("获取财务信息失败");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.result && data.result.data && data.result.data.length > 0) {
        setFinancialData(data.result.data[0]);
        message.success("财务信息获取成功");
      } else {
        message.warning("未找到财务信息");
      }
    },
    onError: (error) => {
      message.error(`获取财务信息失败: ${error instanceof Error ? error.message : "未知错误"}`);
    },
  });

  const handleSelectStock = (record: StockSearchResult) => {
    setSelectedStock(record);
    setFinancialData(null);
    
    let stockCodeWithSuffix = record.code;
    if (record.securityTypeName === "深A") {
      stockCodeWithSuffix = `${record.code}.SZ`;
    } else if (record.securityTypeName === "沪A") {
      stockCodeWithSuffix = `${record.code}.SH`;
    } else if (record.securityTypeName === "京A") {
      stockCodeWithSuffix = `${record.code}.BJ`;
    } else if (record.securityTypeName === "三板") {
      stockCodeWithSuffix = `${record.code}.BJ`;
    }
    
    getFinancialInfoMutation.mutate(stockCodeWithSuffix);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleInsert = () => {
    if (selectedStock) {
      setSelectedStock(null);
      setFinancialData(null);
      setSearchValue("");
      onClose();
    } else {
      message.warning("请先选择一只股票");
    }
  };

  const formatFinancialData = () => {
    if (!financialData) return [];
    
    return Object.entries(financialData).map(([key, value]) => ({
      key,
      name: key,
      value: value !== null && value !== undefined ? value : "-",
      originalKey: key,
    }));
  };

  return (
    <Modal
      title="股票搜索"
      open={open}
      destroyOnHidden
      width={900}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="insert"
          type="primary"
          onClick={handleInsert}
          disabled={!selectedStock}
        >
          插入
        </Button>,
      ]}
    >
      <div className="mb-4">
        <Select
          showSearch
          placeholder="请输入股票名称"
          value={selectedStock ? `${selectedStock.shortName} (${selectedStock.code})` : undefined}
          defaultActiveFirstOption={false}
          showArrow={false}
          filterOption={false}
          onSearch={handleSearch}
          notFoundContent={isLoading ? <Spin size="small" /> : "未找到相关股票"}
          style={{ width: '100%' }}
          size="large"
          onChange={(value, option) => {
            if (option && typeof option === 'object' && 'record' in option) {
              handleSelectStock((option as any).record);
            }
          }}
        >
          {data?.result?.slice(0, 3).map((stock) => (
            <Option key={stock.code} value={stock.code} record={stock}>
              <div>
                <div>{stock.shortName} ({stock.code})</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{stock.securityTypeName}</div>
              </div>
            </Option>
          ))}
        </Select>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <Spin size="large" tip="搜索中..." />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          搜索失败: {error instanceof Error ? error.message : "未知错误"}
        </div>
      )}

      {selectedStock && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold">已选择股票: {selectedStock.shortName} ({selectedStock.code})</h4>
        </div>
      )}

      {getFinancialInfoMutation.isPending && (
        <div className="text-center py-8">
          <Spin size="large" tip="获取财务数据中..." />
        </div>
      )}

      {financialData && (
        <div className="mt-4">
          <Collapse defaultActiveKey={['1']} className="mb-4">
            <Panel header="财务数据" key="1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-2">
                  {formatFinancialData().map((item) => (
                    <div
                      key={item.key}
                      className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium tracking-wide uppercase truncate">
                        {item.name}
                      </div>
                      <div className="text-base font-bold">
                        {(() => {
                          const value = item.value;
                          const key = item.originalKey;
                          
                          if (value === "-") return <span className="text-gray-400 text-sm">-</span>;
                          
                          if (typeof value === 'number' && (key.includes('率') || key.includes('比'))) {
                            return (
                              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                                {(value * 100).toFixed(2)}%
                              </span>
                            );
                          }
                          
                          if (typeof value === 'number' && Math.abs(value) > 100000000) {
                            return (
                              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
                                {(value / 100000000).toFixed(2)}亿
                              </span>
                            );
                          }
                          
                          return (
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full text-xs">
                              {value}
                            </span>
                          );
                        })()}
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