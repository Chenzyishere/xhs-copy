window.BOARD = {
  updated: "2026-11-16",
  account: "虾说说",
  fans: 7,
  sellMode: "个人售卖",
  focus: "一个台看进度、选日期、复制发帖。飞书还没接 webhook 之前，就在这里发。",
  projects: [
    {
      name: "历史人物测试",
      status: "已上线",
      statusKind: "live",
      url: "https://chenzyishere.github.io/xhs-history-test/",
      note: "店铺密码 SHUO16 · 自动发货",
    },
    {
      name: "分院帽测试",
      status: "已上线",
      statusKind: "live",
      url: "https://chenzyishere.github.io/xhs-harry-potter-test/",
      note: "店铺密码 FENYUAN · 收费走通用词",
    },
    {
      name: "人格图鉴日更",
      status: "进行中",
      statusKind: "now",
      url: "",
      note: "软 2 : 硬 1 · 稿到 12-31",
    },
  ],
  you: [
    {
      title: "打开右边月历，发当天三帖",
      detail: "早软 / 午软 / 晚硬广。软文不挂商品，硬广才挂个人售卖。",
    },
    {
      title: "发完守评 15 分钟",
      detail: "点卡片改成已发。要改的标待改，我下一轮改。",
    },
    {
      title: "周末回四个数",
      detail: "粉数、笔记互动、商品点击、有没有人说去晒。",
    },
    {
      title: "飞书看稿还没接就先用这个台",
      detail: "webhook 接到以前，手机直接打开这一页复制。",
    },
  ],
  me: [
    {
      title: "稿已备到 12-31",
      detail: "点没有内容的日期是敬请期待。软文只用历史人物。",
    },
    {
      title: "未发 / 已发 / 待改可跨设备",
      detail: "素材台里贴一枚 GitHub token，状态写在 status 分支。",
    },
    {
      title: "飞书脚本还在等 webhook",
      detail: "通道写好了。你把 FEISHU_WEBHOOK 填进 GitHub Secret 就能试发。",
    },
    {
      title: "封面仍用手做",
      detail: "cover-maker.html。批量封面先别做。",
    },
  ],
  later: [
    { title: "电子资源 / 店铺", reason: "大约要 1000 粉 + 30 条笔记。" },
    { title: "OSS + CDN + 备案", reason: "单点没跑通就迁基建。" },
    { title: "矩阵号、批量封面", reason: "第二个题材有稳定单量后再开。" },
    { title: "一单一码网关", reason: "密码泄露后再上。" },
  ],
  rules: [
    ["你发，我写", "你负责账号、发布、回评。我负责文案、代码、这块台。"],
    ["进行中不超过 3 件", "本周主战场只有日更。别平行开基建。"],
    ["软文不提测试", "好奇留给主页和评论。硬广才挂商品。"],
    ["这一页是事实源", "进度变了就改 js/board-data.js，不要另开备忘。"],
  ],
};
