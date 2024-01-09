# @dgck81lnn/koishi-plugin-xegoe

[![npm](https://img.shields.io/npm/v/@dgck81lnn/koishi-plugin-xegoe?style=flat-square)](https://www.npmjs.com/package/@dgck81lnn/koishi-plugin-xegoe)

用 Xegoe UI 字体（希顶字母 PUA 编码版）将希顶语文本渲染成图片。

依赖 [`puppeteer`](https://puppeteer.koishi.chat/) 服务。

## 用法

```
指令：xegoe <text...>
转换希顶字母
```

输入聊天字母或 PUA 编码皆可。

该指令是 [`xdi8`](https://github.com/DGCK81LNN/koishi-plugin-xdi8) 的子指令。

## 配置

* `src`：字体源，默认为 `url("https://dgck81lnn.github.io/bootstrap-lnn/fonts/XEGOEPUAall.woff2") format("woff2")`

* `maxWidth`：文本区域的 `max-width`，默认为 `15rem`

* `padding`：文本区域的 `padding`，默认为 `0.25rem`
