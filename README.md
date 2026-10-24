# 云飞的学习笔记

网站：[https://jkmbo2.github.io/](https://jkmbo2.github.io/)

使用 Hexo 7.3.0 与 [ShokaX 0.5.4](https://github.com/theme-shoka-x/hexo-theme-shokaX)，通过 GitHub Actions 发布到 GitHub Pages。主题使用官方 npm 包安装，版本由 package-lock.json 固定。

## 本地预览

```powershell
cd D:\MyBlog\shokax-blog
npm ci
npm run dev
```

打开 http://localhost:5173 。推荐 Node.js 22。

## 写文章并发布

```powershell
npm run new -- "文章标题"
```

编辑 source/_posts 中新建的 Markdown 文件，文章示例：

```yaml
---
title: 我的学习记录
date: 2026-10-24 10:00:00
categories: [技术实践]
tags: [Python]
description: 这次学习想解决的问题。
---
```

正文可使用标题、列表、表格、代码块和数学公式。图片放在 source/images/，例如 `![示意图](/images/example.png)`。

预览并构建检查后，推送 main 即可自动发布：

```powershell
npm run build
npm run check
git add .
git commit -m "新增学习笔记"
git push
```

部署过程可在 [GitHub Actions](https://github.com/jkmbo2/jkmbo2.github.io/actions) 查看。Pages 的发布源设置为 GitHub Actions。

## 草稿

```powershell
npx hexo new draft "还在整理的想法"
npm run dev -- --draft
```

草稿位于 source/_drafts，正式构建不发布。写好后执行 `npx hexo publish "还在整理的想法"`。

## 配置

- `_config.yml`：站点名称、作者、网址与 Hexo 配置。
- `_config.shokax.yml`：主题菜单、搜索、首页背景和功能开关。
- `source/images/background.jpg`：用户指定的首页背景原图。
- `source/_data/custom.styl`：少量字号调整，避免大字宣传标题。
- `source/about/index.md`：关于页。
- `source/_posts`：正式文章；标有示例提示的文章可替换或删除。

首页、文章及搜索使用 ShokaX 原生组件。没有配置评论服务或自动播放音乐。Pagefind 搜索索引会在每次构建后自动生成。

更换背景时仍然替换 `source/images/background.jpg`。运行 `npm run dev` 或 `npm run build` 时会自动生成手机、桌面和文章缩略图，网页不再下载原图。生成目录不提交；原图不发布到网站，旧的 `/images/background.jpg` 地址返回压缩 JPEG，兼容已缓存的首页。更换图片后重启本地预览。图片版本号自动更新，避免旧缓存。背景传输失败时会尝试一次较小的 JPEG，并始终保留内嵌预览。首页背景使用独立绘制层，避免负层级落到页面背景后面。

## 目录与维护

`node_modules`、`public`、本地工具及临时文件不提交。主题依赖通过 npm ci 安装，不要直接修改 node_modules。

原来的 Hugo 项目仍在本地另一个目录中，当前仓库源码与线上网站已经改为 Hexo。旧文章已迁移，初始草稿仍保持为草稿。

主题为 AGPL-3.0-or-later；上游许可证和使用限制见 [ShokaX 仓库](https://github.com/theme-shoka-x/hexo-theme-shokaX)。站点自定义代码可在本仓库查看。
