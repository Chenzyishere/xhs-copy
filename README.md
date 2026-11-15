# 人格图鉴 · 软文素材台

给「虾说说」用的发帖台：左侧作战看板（进行中 / 你要干 / 我要干），右侧月历，下面每天三张卡片。进度改 [js/board-data.js](js/board-data.js)。

预备区间：**2026-11-15 至 2026-12-31**。软文只用历史人物；分院帽只出现在硬广。11/22 起硬广按日独写。月历点日期；没有稿的日子显示「敬请期待」。

11/15–11/21 在 [js/data.js](js/data.js)，11/22–12/31 在 [js/data-winter.js](js/data-winter.js)。

## 本地

双击 `index.html`，或：

```bash
npx --yes serve .
```

## 状态同步

未发 / 已发 / 待改默认先存在这台设备。要手机和电脑共用一份状态：

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate
2. Resource owner 选你自己，Repository 只勾 `xhs-copy`
3. Repository permissions 里 **Contents: Read and write**，其余保持 No access
4. 生成后打开素材台，点「同步设置」，把 token 贴进去，保存并同步

Token 只存在该浏览器，不进仓库。状态写在 `status` 分支的 `status.json`，不会触发 Pages 部署。

换设备再贴一次同一枚 token。点「备份状态」仍可当逃生口。

## 部署

GitHub Pages：`https://chenzyishere.github.io/xhs-copy/`
