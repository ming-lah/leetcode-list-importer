# LeetCode 题单工具集

批量导入 + 导出 LeetCode 自定义题单的浏览器脚本工具。

**兼容 leetcode.com（国际站）和 leetcode.cn（中国站）**，自动检测当前域名。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-3.0.0-green.svg)

## 功能特性

- **批量导入** - 通过 `batchAddQuestionsToFavorite` 一次添加多个题目，高效不重复
- **题单导出** - 从题单页面导出所有题目信息为 CSV（含题号、难度、标签）
- **自动分页** - 突破 100 题限制，查询全量题目库
- **双站兼容** - 自动检测 leetcode.com / leetcode.cn，无需手动改域名
- **双输入方式** - 支持题号（questionId）或 slug 两种输入
- **防限流保护** - 自动控制请求频率

## 文件说明

| 文件 | 功能 |
|------|------|
| `leetcode-list-importer.js` | 批量导入题目到自定义题单 |
| `export_problems.js` | 导出题单为 CSV + 输出 slug/题号映射 |

## 快速开始

### 场景一：导入题目到题单

1. 打开 LeetCode 题单页面（确保已登录）
2. 按 `F12` 打开 DevTools → Console
3. 编辑 `leetcode-list-importer.js`，填入 `PROBLEM_IDS` 或 `PROBLEM_SLUGS`
4. 粘贴到 Console，回车执行
5. 在弹窗中输入题单 ID（从 URL 获取，如 `62SpAJ7O`）
6. 等待完成

**配置示例：**

```javascript
// 方式一：题号
const PROBLEM_IDS = [1, 2, 3, 15, 42, 100];

// 方式二：slug
const PROBLEM_SLUGS = ["two-sum", "add-two-numbers"];
```

### 场景二：导出题单为 CSV

1. 打开 LeetCode 题单页面（确保已登录）
2. 如果题目很多，先滚动到底部加载全部
3. 按 `F12` 打开 DevTools → Console
4. 粘贴 `export_problems.js`，回车执行
5. 自动下载 `leetcode_problems.csv`

**导出字段：**

| 字段 | 说明 |
|------|------|
| Problem ID | 题号 |
| Title | 题目标题 |
| Slug | URL 标识 |
| Difficulty | 难度（Easy / Medium / Hard）|
| URL | 题目链接 |
| Topics | 标签（用 \| 分隔）|

**附加输出：** 控制台会同时打印 `PROBLEM_IDS` 和 `PROBLEM_SLUGS` 数组，可直接复制到 importer 使用。

## 典型工作流

1. 用 `export_problems.js` 导出某个公开题单 → 获得 CSV + 题号列表
2. 在 CSV 中筛选需要的题目
3. 将题号复制到 `leetcode-list-importer.js` 的 `PROBLEM_IDS`
4. 运行 importer 批量添加到自己的题单

## 高级配置

```javascript
const CONFIG = {
    pageSize: 100,       // 每页查询数量（最大 100）
    queryDelay: 300,     // 分页查询间隔（毫秒）
    addBatchSize: 20,    // 每批添加数量
    addDelay: 1000,      // 批次间添加间隔（毫秒）
};
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `pageSize` | 100 | 每次查询的题目数量，最大 100 |
| `queryDelay` | 300 | 查询间隔，防止被限流 |
| `addBatchSize` | 20 | 每次添加的题目数量 |
| `addDelay` | 1000 | 添加间隔，防止被限流 |

## 常见问题

**Q: 为什么有些题目找不到？**
题号输入错误、题目已被删除/合并、或网络超时。

**Q: 导入速度太慢？**
调小 `queryDelay` 和 `addDelay`，增大 `addBatchSize`。注意过低会触发限流。

**Q: 提示"无法获取 CSRF Token"？**
确保已在 LeetCode 登录，刷新页面后重试。

**Q: 可以导入多个题单吗？**
多次运行即可，每次输入不同的题单 ID。

## 许可证

MIT License
