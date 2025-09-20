## 代码风格指南

### 组件结构与组织
- 如果一个组件比较复杂，单独 独立的逻辑可能略多，可以考虑把单独的逻辑抽成一些函数，放在文件的最下方 弄成function xxx() 然后上面代码去调用。 JSX里的代码就没必要太处理了，jsx稍微长一点问题不大

### 状态管理
- react代码里 尽量不要使用useState useCallback useeffect等hook，尽可能使用一些react use库里的方法，或者react query啊等等。
- react项目中，很多的状态真的很有必要吗？ 问问自己，弄一堆的state太丑了，尽量useQuery useMutation react use之类的简化掉

### 错误处理
- 不要做异常处理，少写try catch等。let it crush, 就算要写try catch 尽量用一些函数式的try catch方法
- 异常状态考虑if (xxx) return 代码提前返回退出掉，不要写一大坨的if else 块特别长的

### 代码风格
- 代码风格上考虑多使用一些函数式的风格, 但是没必要用lodash/fp 这种特别函数式的
- 多使用变量解构，不要防御性编程，做很多的判断。做最核心的部分判断就行了
- 返回jsx的时候，没必要用() 去包裹一下，真的没必要，搞得代码特别长
- **不要写注释**
- 尽可能import 各种hooks 组合完成任务，不要去重复造轮子实现已有的功能，很多功能你都可以用react-use这个库里的东西实现。你可以多用context7 去查这个库的文档
- 我希望代码尽量短一点，你不要脱裤子放屁写一坨
- 做i18n的时候，只需要处理英文的就行了

### 库使用
- 一些库如果你不太了解怎么使用的，或者不太确定应该怎么用 立马**用context7的方法自己去查询**
- 尽量不要用switch case 复杂的if else等，请使用ts-pattern这个库去简化代码 用context7的方法自己去查询
- 多使用lodash的一些工具方法 简化代码

### 函数与参数
- 不超过5行的函数，直接写在JSX里就完事了, 不要在组件的宝贵空间里写。inline一下就行
- 没必要函数什么参数都接收，按最小化原则去处理啊？？

### 弹窗处理
<!-- - 处理弹窗的时候，简单的弹窗直接静态方法打开，复杂的弹窗尽量新写个组件文件，然后ebay nice modal这个库去打开 -->

---

## StockSearchModal 代码风格示例

### 导入组织
- 第三方库导入优先，其次是本地组件、工具函数、类型定义
- 使用 "use client" 指令明确标识客户端组件
- 类型导入使用 `type` 关键字，避免运行时引入

```tsx
"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { Modal, Select, Spin, Collapse } from "antd";
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
```

### 组件定义与类型
- 组件 props 使用 TypeScript 接口明确定义
- 使用简洁的类型别名定义复杂类型
- 函数组件使用解构参数获取 props

```tsx
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
```

### 状态管理与数据获取
- 使用 React Query 的 `useQuery` 和 `useMutation` 替代 useState
- 使用自定义 hook (如 `useDebounceValue`) 封装常用逻辑
- 查询键使用数组形式，便于依赖管理

```tsx
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
```

### 模式匹配与函数式编程
- 使用 `ts-pattern` 库替代复杂的 switch case 和 if else
- 采用函数式编程风格，链式调用处理数据

```tsx
return match(formatFinancialValue(key, value) as string)
  .with(P.string.includes('%'), value => <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
    {value}
  </span>)
  .with(P.string.includes('亿'), value => <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
    {value}
  </span>)
  .with('-', () => <span className="text-gray-400 text-sm">-</span>)
  .otherwise(value => <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full text-xs">
    {value}
  </span>)
```

### JSX 结构与样式
- 使用 Tailwind CSS 进行样式设计，支持深色模式
- 条件渲染使用提前返回模式，避免嵌套过深
- 短函数直接内联在 JSX 中

```tsx
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
          {/* 内容 */}
        </div>
      </Panel>
    </Collapse>
  </div>
)}
```

### 工具函数组织
- 复杂逻辑抽离为独立函数，放在文件底部
- 函数职责单一，命名清晰
- 使用 lodash 工具函数简化代码

```tsx
const formatStockCode = (record: StockSearchResult): string => {
  const { code, securityTypeName } = record;
  return match(securityTypeName)
    .with("深A", () => `${code}.SZ`)
    .with("沪A", "科创板", () => `${code}.SH`)
    .with("京A", "三板", () => `${code}.BJ`)
    .otherwise(() => code);
};

const formatFinancialValue = (key: string, value: any): string => {
  if (typeof value !== 'number') {
    return typeof value === 'string' && key.includes('日期')
      ? value.split(' ')[0] // 只显示日期部分
      : String(value);
  }

  return match(key)
    .when(k => k.includes('市盈率') || k.includes('市净率') || k.includes('PE') || k.includes('PB'),
      () => `${value.toFixed(2)}倍`)
    .when(k => (k.includes('率') || k.includes('比') || k.includes('收益率') || k.includes('ROE') || k.includes('ROA')) &&
      !k.includes('市盈率') && !k.includes('市净率'),
      () => `${value.toFixed(2)}%`)
    .otherwise(() => value.toFixed(2));
};
```