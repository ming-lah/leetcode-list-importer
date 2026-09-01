# LeetCode 批量导入题单工具

一个简洁高效的 LeetCode 题单批量导入脚本，支持将任意题号列表批量添加到自定义题单。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-green.svg)

## ✨ 功能特性

- 🚀 **高效批量导入** - 一次添加多个题目，节省时间
- 📋 **自动分页查询** - 突破100题限制，获取所有题目
- 📊 **实时进度显示** - 清晰了解导入进度
- 🛡️ **防限流保护** - 自动控制请求频率
- 🔧 **易于配置** - 简单修改题号列表即可使用

## 📋 前提条件

1. 已注册并登录 [LeetCode 中国站](https://leetcode.cn/)
2. 已创建一个自定义题单（或准备创建）
3. 浏览器已登录 LeetCode

## 🚀 快速开始

### 1. 获取题单ID

1. 打开你的 LeetCode 题单页面
2. URL 类似于：`https://leetcode.cn/problem-list/62SpAJ7O/`
3. 其中的 `62SpAJ7O` 就是你的题单ID

### 2. 配置题号列表

打开 `leetcode-list-importer.js`，修改 `PROBLEM_IDS` 数组：

```javascript
const PROBLEM_IDS = [
    1,      // Two Sum
    2,      // Add Two Numbers
    3,      // Longest Substring Without Repeating Characters
    15,     // 3Sum
    42,     // Trapping Rain Water
    // ... 添加更多题号
];
```

### 3. 运行脚本

1. 在 LeetCode 中国站登录你的账号
2. 按 `F12` 打开浏览器开发者工具
3. 切换到 `Console`（控制台）标签
4. 复制 `leetcode-list-importer.js` 的全部内容
5. 粘贴到控制台并按 `Enter` 运行
6. 在弹出的对话框中输入你的题单ID
7. 等待导入完成

## 📊 输出示例

```
🚀 LeetCode 批量导入题单工具 v2.0.0
==================================================

📝 目标题单: 62SpAJ7O
📝 需要导入: 141 道题目

==================================================
第一步：查询题目
==================================================
📋 查询题目列表...
   总数: 3500，已获取: 100
   查询 101-200...
   查询 201-300...
   ...
✅ 查询完成，共 3500 个题目

📊 查询结果:
   ✅ 找到: 141/141

==================================================
第二步：添加到题单
==================================================

📦 批次 1/8
   ✅ 成功
   📊 进度: 13%

📦 批次 2/8
   ✅ 成功
   📊 进度: 25%

...

🎉 完成！
==================================================
✅ 成功: 141
❌ 失败: 0
⏱️  耗时: 85秒
🔗 题单: https://leetcode.cn/problem-list/62SpAJ7O/
```

## ⚙️ 高级配置

脚本顶部的 `CONFIG` 对象允许你自定义行为：

```javascript
const CONFIG = {
    endpoint: 'https://leetcode.cn/graphql/',  // API端点
    pageSize: 100,         // 每页查询数量（最大100）
    queryDelay: 300,       // 查询间隔（毫秒）
    addBatchSize: 20,      // 每批添加数量
    addDelay: 1000,        // 添加间隔（毫秒）
};
```

### 配置说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `pageSize` | 100 | 每次查询的题目数量，最大100 |
| `queryDelay` | 300 | 查询间隔，防止被限流 |
| `addBatchSize` | 20 | 每次添加的题目数量 |
| `addDelay` | 1000 | 添加间隔，防止被限流 |

## 🔍 工作原理

### 1. 分页查询

LeetCode 的 GraphQL API 单次查询最多返回 100 个题目。脚本使用 `skip` 参数进行分页：

```
第1次: skip=0,   limit=100  → 获取第 1-100 题
第2次: skip=100, limit=100  → 获取第 101-200 题
第3次: skip=200, limit=100  → 获取第 201-300 题
... 直到获取所有题目
```

### 2. 批量添加

使用 `batchAddQuestionsToFavorite` mutation 批量添加：

```graphql
mutation batchAddQuestionsToFavorite($favoriteSlug: String!, $questionSlugs: [String]!) {
    batchAddQuestionsToFavorite(favoriteSlug: $favoriteSlug, questionSlugs: $questionSlugs) {
        ok
        error
    }
}
```

### 3. CSRF Token

从浏览器 Cookie 中获取 CSRF Token 用于身份验证：

```javascript
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return null;
}
```

## ❓ 常见问题

### Q: 为什么有些题目找不到？

A: 可能的原因：
- 题号输入错误
- 题目已被 LeetCode 删除或合并
- 网络请求超时

### Q: 导入速度太慢怎么办？

A: 可以调整配置：
```javascript
const CONFIG = {
    queryDelay: 100,    // 减少查询间隔
    addDelay: 500,      // 减少添加间隔
    addBatchSize: 30,   // 增加每批数量
};
```

⚠️ 注意：设置过低可能触发 LeetCode 的限流机制。

### Q: 提示"无法获取CSRF Token"？

A: 请确保：
1. 已在 LeetCode 登录
2. 刷新页面后重新运行脚本
3. 浏览器允许 Cookie

### Q: 可以同时导入多个题单吗？

A: 当前版本只支持单个题单。如需导入多个，请修改脚本或多次运行。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [LeetCode](https://leetcode.cn/) - 提供优秀的算法练习平台
- 所有贡献者和使用者

## 📮 联系方式

- Issues: [GitHub Issues](https://github.com/your-username/leetcode-list-importer/issues)

---

**如果这个工具对你有帮助，请给个 ⭐ Star 支持一下！**