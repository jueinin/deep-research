"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal, Select, Button, Spin, message, Collapse } from "antd";
import { useTaskStore } from "@/store/task";
import { currentDate } from "./defaultPrompt";
import type {
  StockSearchResult,
  StockSearchResponse,
  StockFinancialInfo,
  StockFinancialInfoResponse
} from "@/types/stock";

const { Panel } = Collapse;
const { Option } = Select;

interface StockSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StockSearchModal({ open, onClose }: StockSearchModalProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [financialData, setFinancialData] = useState<StockFinancialInfo | null>(null);
  const {question, setQuestion} = useTaskStore()

  const { data, isLoading, error } = useQuery({
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
    mutationFn: async (stockCode: string): Promise<StockFinancialInfoResponse> => {
      const response = await fetch(`/api/search/eastmoney/get-stock-financial-info?code=${stockCode}`);
      if (!response.ok) {
        throw new Error("获取财务信息失败");
      }
      return response.json() as Promise<StockFinancialInfoResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setFinancialData(data.data);
        message.success("财务信息获取成功");
      } else {
        message.warning(data.message || "未找到财务信息");
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
      // 生成替换后的文本
      const replacedText = generateReplacedText();
      setQuestion(replacedText);
      
      setSelectedStock(null);
      setFinancialData(null);
      setSearchValue("");
      onClose();
    } else {
      message.warning("请先选择一只股票");
    }
  };

  const generateReplacedText = (): string => {
    // 使用当前的question作为模板
    const template = question;
    if (!selectedStock || !financialData) return template;

    // 创建财务数据表格
    const financialTable = generateFinancialTable();
    
    // 创建映射关系
    const replacements: Record<string, string> = {
      '股票名称': selectedStock.shortName,
      '市盈率TTM': getFinancialValue('市盈率TTM' as keyof StockFinancialInfo),
      '财务数据表格': financialTable,
      currentDate: currentDate,
      当前股价: "" + financialData.当前价格
    };

    // 替换模板中的占位符
    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return result;
  };

  const getFinancialValue = (key: keyof StockFinancialInfo): string => {
    if (!financialData) return "-";
    
    const value = financialData[key];
    if (value === null || value === undefined) return "-";
    
    return formatFinancialValue(key as string, value);
  };

  const generateFinancialTable = (): string => {
    if (!financialData) return "无财务数据";
    
    // 筛选出需要展示的财务指标
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
    
    // 生成表格头部
    let table = "| 指标名称 | 数值 |\n| --- | --- |\n";
    
    // 添加表格行
    importantKeys.forEach(key => {
      if (financialData[key as keyof StockFinancialInfo] !== null && financialData[key as keyof StockFinancialInfo] !== undefined) {
        const formattedValue = formatFinancialValue(key, financialData[key as keyof StockFinancialInfo]);
        table += `| ${key} | ${formattedValue} |\n`;
      }
    });
    
    return table;
  };

  const formatFinancialData = () => {
    if (!financialData) return [];
    
    return Object.entries(financialData).map(([key, value]) => {
      if (value === null || value === undefined) {
        return {
          key,
          name: key,
          value: "-",
          originalKey: key,
        };
      }
      
      return {
        key,
        name: key,
        value: formatFinancialValue(key, value),
        originalKey: key,
      };
    });
  };

  const formatFinancialValue = (key: string, value: any): string => {
    if (typeof value !== 'number') {
      if (typeof value === 'string' && key.includes('日期')) {
        return value.split(' ')[0]; // 只显示日期部分
      }
      return String(value);
    }
    
    // 处理市盈率、市净率等比率 - 这些应该显示为倍数
    if (key.includes('市盈率') || key.includes('市净率') || key.includes('PE') || key.includes('PB')) {
      return `${value.toFixed(2)}倍`;
    }
    
    // 处理百分比数据 - 后端已经返回百分比值，不需要再乘以100
    // 但要排除市盈率、市净率等，因为它们虽然名字里有"率"但实际上是倍数
    if ((key.includes('率') || key.includes('比') || key.includes('收益率') || key.includes('ROE') || key.includes('ROA')) &&
        !key.includes('市盈率') && !key.includes('市净率')) {
      return `${value.toFixed(2)}%`;
    }
    
    // 处理每股数据
    if (key.includes('每股')) {
      return `${value.toFixed(2)}元`;
    }
    
    // 处理金额数据（单位：元）
    if (key.includes('收入') || key.includes('利润') || key.includes('资产') || key.includes('市值') || key.includes('净资产') || key.includes('股本')) {
      if (Math.abs(value) >= 100000000) {
        return `${(value / 100000000).toFixed(2)}亿`;
      } else if (Math.abs(value) >= 10000) {
        return `${(value / 10000).toFixed(2)}万`;
      } else {
        return `${value.toFixed(2)}元`;
      }
    }
    
    // 默认情况
    return value.toFixed(2);
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
                          
                          if (value === "-") return <span className="text-gray-400 text-sm">-</span>;
                          
                          // 根据值的内容和类型决定样式
                          if (typeof value === 'string') {
                            if (value.includes('%')) {
                              return (
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                                  {value}
                                </span>
                              );
                            } else if (value.includes('亿')) {
                              return (
                                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
                                  {value}
                                </span>
                              );
                            } else if (value.includes('万')) {
                              return (
                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                                  {value}
                                </span>
                              );
                            } else if (value.includes('元')) {
                              return (
                                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full text-xs">
                                  {value}
                                </span>
                              );
                            } else if (value.includes('倍')) {
                              return (
                                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs">
                                  {value}
                                </span>
                              );
                            }
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