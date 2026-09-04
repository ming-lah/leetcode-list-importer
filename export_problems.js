/**
 * LeetCode 题单导出工具 v2.0
 *
 * 从当前题单页面导出所有题目信息为 CSV 文件。
 * 兼容 leetcode.com / leetcode.cn，自动检测域名。
 *
 * 使用方法：
 *   1. 打开你的 LeetCode 题单页面（确保已登录）
 *   2. 如果题目很多，先滚动到底部加载全部题目
 *   3. 打开 DevTools → Console（F12）
 *   4. 粘贴本脚本，回车执行
 *   5. 自动下载 leetcode_problems.csv
 *
 * 附加功能：
 *   - 控制台同时输出 slug → questionId 映射，方便后续使用
 *
 * @license MIT
 */

(async () => {
  // ========== 自动检测域名 ==========
  const HOST = window.location.hostname;
  const GRAPHQL_URL = `https://${HOST}/graphql`;
  console.log(`当前站点: ${HOST}`);

  // ========== 第一步：从当前页面 DOM 抓取题目 slug ==========
  const slugs = [...new Set(
    Array.from(document.querySelectorAll("a"))
      .filter(a => a.href.includes("/problems/") && !a.href.includes("/solution"))
      .map(a => {
        const m = a.href.match(/\/problems\/([^\/?]+)/);
        return m ? m[1] : "";
      })
      .filter(Boolean)
  )];

  if (slugs.length === 0) {
    console.error("未找到任何题目链接，请确认已打开题单页面并加载了题目");
    return;
  }

  console.log(`发现 ${slugs.length} 道题目，开始通过 GraphQL 查询详情...`);

  // ========== 第二步：GraphQL 查询每道题的详情 ==========
  const QUERY = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags { name }
      }
    }
  `;

  const results = [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    try {
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
      });
      const json = await res.json();
      const q = json.data?.question;

      if (!q) {
        console.log(`跳过 ${slug} — 未找到题目数据`);
        continue;
      }

      const problemId = q.questionFrontendId;
      const title = q.title;
      const difficulty = q.difficulty;
      const topics = q.topicTags.map(t => t.name).join("|");
      const url = `https://${HOST}/problems/${q.titleSlug}/`;

      console.log(`${i + 1}/${slugs.length}: [${problemId}] ${title} | ${difficulty} | ${topics}`);

      results.push({ title, slug, url, difficulty, problemId, topics });
    } catch (err) {
      console.error(`请求 ${slug} 出错:`, err);
    }

    if (i < slugs.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // ========== 第三步：输出 slug → questionId 映射 ==========
  console.log("\n=== slug → questionId 映射（可用于批量导入）===");
  const idList = results.map(r => r.problemId);
  console.log(`const PROBLEM_IDS = [${idList.join(", ")}];`);

  const slugList = results.map(r => `"${r.slug}"`);
  console.log(`const PROBLEM_SLUGS = [${slugList.join(", ")}];`);

  // ========== 第四步：生成 CSV 并下载 ==========
  const csvRows = [
    ["Problem ID", "Title", "Slug", "Difficulty", "URL", "Topics"].join(","),
    ...results.map(r =>
      [
        r.problemId,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.slug}"`,
        r.difficulty,
        `"${r.url}"`,
        `"${r.topics}"`,
      ].join(",")
    ),
  ].join("\n");

  // BOM 头让 Excel 正确识别 UTF-8 中文
  const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leetcode_problems.csv";
  a.click();

  console.log(`\n下载完成！共导出 ${results.length} 道题目 → leetcode_problems.csv`);
})();
