# LeetCode 批量导入题单工具

一个简洁高效的 LeetCode 题单批量导入脚本，支持将任意题号列表批量添加到自定义题单。

![LeetCode Logo](https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](https://github.com/your-username/leetcode-list-importer/releases)

## ✨ 功能特性

- 🚀 **高效批量导入** - 一次添加多个题目，节省时间
- 📋 **自动分页查询** - 突破100题限制，获取所有题目
- 📊 **实时进度显示** - 清晰了解导入进度
- 🛡️ **防限流保护** - 自动控制请求频率
- 🔧 **易于配置** - 简单修改题号列表即可使用

## 📸 效果演示

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

...

🎉 完成！
==================================================
✅ 成功: 141
❌ 失败: 0
⏱️  耗时: 85秒
🔗 题单: https://leetcode.cn/problem-list/62SpAJ7O/
```

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

1. 在 [LeetCode 中国站](https://leetcode.cn/) 登录你的账号
2. 按 `F12` 打开浏览器开发者工具
3. 切换到 `Console`（控制台）标签
4. 复制 `leetcode-list-importer.js` 的全部内容
5. 粘贴到控制台并按 `Enter` 运行
6. 在弹出的对话框中输入你的题单ID
7. 等待导入完成

## 📖 详细文档

查看 [README.md](README.md) 获取完整文档，包括：

- ⚙️ 高级配置选项
- 🔍 工作原理详解
- ❓ 常见问题解答
- 🤝 贡献指南

## ⚙️ 高级配置

```javascript
const CONFIG = {
    pageSize: 100,         // 每页查询数量（最大100）
    queryDelay: 300,       // 查询间隔（毫秒）
    addBatchSize: 20,      // 每批添加数量
    addDelay: 1000,        // 添加间隔（毫秒）
};
```

## 🔍 工作原理

1. **分页查询** - 使用 `skip` 参数分页获取所有题目
2. **批量添加** - 使用 `batchAddQuestionsToFavorite` mutation
3. **CSRF验证** - 从 Cookie 获取 Token 进行身份验证

## ❓ 常见问题

<details>
<summary>为什么有些题目找不到？</summary>

可能的原因：
- 题号输入错误
- 题目已被 LeetCode 删除或合并
- 网络请求超时
</details>

<details>
<summary>导入速度太慢怎么办？</summary>

可以调整配置：
```javascript
const CONFIG = {
    queryDelay: 100,    // 减少查询间隔
    addDelay: 500,      // 减少添加间隔
    addBatchSize: 30,   // 增加每批数量
};
```

⚠️ 注意：设置过低可能触发限流
</details>

<details>
<summary>提示"无法获取CSRF Token"？</summary>

请确保：
1. 已在 LeetCode 登录
2. 刷新页面后重新运行脚本
3. 浏览器允许 Cookie
</details>

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

- 提交 [Issue](https://github.com/your-username/leetcode-list-importer/issues)

---

**如果这个工具对你有帮助，请给个 ⭐ Star 支持一下！**