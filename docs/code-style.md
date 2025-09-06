- 如果一个组件比较复杂，单独 独立的逻辑可能略多，可以考虑把单独的逻辑抽成一些函数，放在文件的最下方 弄成function xxx() 然后上面代码去调用。 JSX里的代码就没必要太处理了，jsx稍微长一点问题不大

- react代码里 尽量不要使用useState useCallback useeffect等hook，尽可能使用一些react use库里的方法，或者react query啊等等。

- 不要做异常处理，少写try catch等。let it crush, 就算要写try catch 尽量用一些函数式的try catch方法

- 代码风格上考虑多使用一些函数式的风格

- 一些库如果你不太了解怎么使用的，或者不太确定应该怎么用 立马**用context7的方法自己去查询**

- 尽量不要用switch case 复杂的if else等，请使用ts-pattern这个库去简化代码 用context7的方法自己去查询

- 多使用lodash的一些工具方法 简化代码

- 多使用变量解构，不要防御性编程，做很多的判断。做最核心的部分判断就行了

- 不超过5行的函数，直接写在JSX里就完事了, 不要在组件的宝贵空间里写。inline一下就行

- 没必要函数什么参数都接收，按最小化原则去处理啊？？

- react项目中，很多的状态真的很有必要吗？ 问问自己，弄一堆的state太丑了，尽量useQuery useMutation react use之类的简化掉

- 异常状态考虑if (xxx) return 代码提前返回退出掉，不要写一大坨的if else 块特别长的

- 返回jsx的时候，没必要用() 去包裹一下，真的没必要，搞得代码特别长

<!-- - 处理弹窗的时候，简单的弹窗直接静态方法打开，复杂的弹窗尽量新写个组件文件，然后ebay nice modal这个库去打开 -->