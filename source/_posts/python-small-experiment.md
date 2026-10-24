---
title: 用一个小实验，理解 Python 的列表与引用
date: 2026-10-21
slug: python-small-experiment
description: 两个变量为什么会一起改变？从一个可复现的例子开始，区分变量、对象，以及浅拷贝的边界。
categories: [技术实践]
tags: [Python, 基础概念, 动手实验]
sample: true
art: /images/grid.svg
artAlt: 深绿色网格中相互连接的抽象节点
---

> 示例文章：用于展示博客的排版与阅读功能，可替换成你自己的学习记录。


## 一个让人困惑的结果

先看这段代码。在运行之前，试着预测第二行输出：

```python
first = [1, 2, 3]
second = first
second.append(4)

print(first)   # [1, 2, 3, 4]
print(second)  # [1, 2, 3, 4]
```

我们明明只修改了 `second`，为什么 `first` 也变了？

## 赋值并没有复制列表

在这里，`second = first` 让两个变量指向同一个列表对象。`append` 修改的是这个对象，而不是某个变量独有的副本。

用 `is` 可以检查两个变量是否指向同一个对象：

```python
print(first is second)  # True
```

这和 `==` 不同。`==` 通常比较值是否相等；`is` 比较是否为同一个对象。

## 先做一份浅拷贝

对于只包含这些数字的列表，`copy` 可以建立新的外层列表：

```python
first = [1, 2, 3]
second = first.copy()
second.append(4)

print(first)            # [1, 2, 3]
print(second)           # [1, 2, 3, 4]
print(first is second)  # False
```

## 嵌套结构的边界

浅拷贝只复制外层容器。对于列表里的可变对象，引用仍然可能共享：

```python
first = [[1], [2]]
second = first.copy()
second[0].append(9)

print(first)                 # [[1, 9], [2]]
print(first is second)       # False
print(first[0] is second[0]) # True
```

这也提醒我们，写「复制了列表」还不够准确。需要说明复制了哪一层、哪些对象仍然共享。

## 给下一次练习的问题

- 把 `append` 换成 `second = [4, 5]`，结果会怎样？
- 如果内层对象是不可变的整数，和嵌套列表有什么区别？
- 什么时候需要 `copy.deepcopy`，什么时候保留共享引用反而是有意为之？

先做预测，再运行验证。一个很小的实验，也可以成为理解复杂程序的基础。
