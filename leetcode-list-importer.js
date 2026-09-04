/**
 * LeetCode 批量导入题单工具 v3.0
 *
 * 合并 leetcode-list-importer 与 leetcode-scripts 的优势：
 *   - 自动检测 leetcode.com / leetcode.cn（无需手动改域名）
 *   - 分页查询所有题目，突破 100 题限制
 *   - 使用 batchAddQuestionsToFavorite 批量添加（一次传多个 slug）
 *   - 支持题号或 slug 两种输入方式
 *   - 实时进度显示 + 防限流保护
 *
 * 使用方法：
 *   1. 在 leetcode.cn / leetcode.com 登录你的账号
 *   2. 打开 DevTools → Console（F12）
 *   3. 修改下方 PROBLEM_IDS（题号）或 PROBLEM_SLUGS（slug）
 *   4. 粘贴脚本并运行
 *   5. 在弹窗中输入你的题单 ID
 *
 * @license MIT
 */

// ============================================
// 配置区域
// ============================================

/**
 * 方式一：通过题号导入
 * 示例：[1, 2, 3, 15, 42, 100]
 */
const PROBLEM_IDS = [
    // 在这里填入题号，例如：1, 2, 3, 15, 42, 100
];

/**
 * 方式二：通过 slug 导入（与题号二选一，留空即可）
 * 示例：["two-sum", "add-two-numbers"]
 */
const PROBLEM_SLUGS = [
    // 在这里填入 slug，例如："two-sum", "add-two-numbers"
];

// ============================================
// 高级配置
// ============================================

const CONFIG = {
    pageSize: 100,       // 每页查询数量（最大 100）
    queryDelay: 300,     // 分页查询间隔（毫秒）
    addBatchSize: 20,    // 每批添加数量
    addDelay: 1000,      // 批次间添加间隔（毫秒）
};

// ============================================
// 核心代码
// ============================================

// 自动检测域名
const HOST = window.location.hostname;
const ENDPOINT = `https://${HOST}/graphql/`;

function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildHeaders(csrfToken, referer) {
    const h = { 'Content-Type': 'application/json' };
    if (csrfToken) h['X-CSRFToken'] = csrfToken;
    if (referer) h['Referer'] = referer;
    return h;
}

/**
 * 分页查询所有题目，返回 { questionId: titleSlug } 映射
 */
async function fetchAllProblems(csrfToken) {
    const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                total
                questions {
                    frontendQuestionId
                    titleSlug
                }
            }
        }
    `;

    const slugMap = {};   // questionId -> titleSlug
    let skip = 0;
    let total = 0;

    console.log('查询题目列表...');

    // 首次查询获取总数
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(csrfToken, `https://${HOST}/problemset/`),
            body: JSON.stringify({
                query,
                variables: { categorySlug: '', skip: 0, limit: CONFIG.pageSize, filters: {} }
            })
        });
        const data = await res.json();
        if (data.data?.problemsetQuestionList) {
            total = data.data.problemsetQuestionList.total;
            for (const q of data.data.problemsetQuestionList.questions) {
                slugMap[q.frontendQuestionId] = q.titleSlug;
            }
            console.log(`  总数: ${total}，已获取: ${Object.keys(slugMap).length}`);
        }
    } catch (err) {
        console.error('首次查询失败:', err);
        return slugMap;
    }

    // 分页查询剩余
    skip = CONFIG.pageSize;
    while (skip < total) {
        console.log(`  查询 ${skip + 1}-${Math.min(skip + CONFIG.pageSize, total)}...`);
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: buildHeaders(csrfToken, `https://${HOST}/problemset/`),
                body: JSON.stringify({
                    query,
                    variables: { categorySlug: '', skip, limit: CONFIG.pageSize, filters: {} }
                })
            });
            const data = await res.json();
            if (data.data?.problemsetQuestionList) {
                for (const q of data.data.problemsetQuestionList.questions) {
                    slugMap[q.frontendQuestionId] = q.titleSlug;
                }
            }
            await sleep(CONFIG.queryDelay);
        } catch (err) {
            console.error('  查询失败:', err);
        }
        skip += CONFIG.pageSize;
    }

    console.log(`查询完成，共 ${Object.keys(slugMap).length} 个题目`);
    return slugMap;
}

/**
 * 批量添加题目到题单（一次请求添加多个）
 */
async function batchAddToFavorite(favoriteSlug, questionSlugs, csrfToken) {
    const query = `
        mutation batchAddQuestionsToFavorite($favoriteSlug: String!, $questionSlugs: [String]!) {
            batchAddQuestionsToFavorite(favoriteSlug: $favoriteSlug, questionSlugs: $questionSlugs) {
                ok
                error
            }
        }
    `;
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(csrfToken, `https://${HOST}/problem-list/${favoriteSlug}/`),
            body: JSON.stringify({
                query,
                variables: { favoriteSlug, questionSlugs }
            })
        });
        return await res.json();
    } catch (err) {
        return { errors: [err.message] };
    }
}

// ============================================
// 主流程
// ============================================

async function main() {
    const startTime = Date.now();

    console.log('LeetCode 批量导入题单工具 v3.0');
    console.log('='.repeat(50));
    console.log(`当前站点: ${HOST}`);

    // 合并两种输入方式
    let problemIds = [...PROBLEM_IDS];

    if (PROBLEM_SLUGS.length > 0) {
        // 如果用户填了 slug，先查询对应的 questionId
        console.log('\n检测到 slug 列表，先查询对应题号...');
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            console.error('无法获取 CSRF Token，请确保已登录');
            return;
        }
        const slugMap = await fetchAllProblems(csrfToken);
        // 反向映射：titleSlug -> questionId
        const reverseMap = {};
        for (const [id, slug] of Object.entries(slugMap)) {
            reverseMap[slug] = id;
        }
        for (const slug of PROBLEM_SLUGS) {
            if (reverseMap[slug]) {
                problemIds.push(Number(reverseMap[slug]));
            } else {
                console.warn(`  未找到 slug: ${slug}`);
            }
        }
        console.log(`  从 slug 解析出 ${problemIds.length} 个题号`);
    }

    if (problemIds.length === 0) {
        console.error('请先配置 PROBLEM_IDS 或 PROBLEM_SLUGS');
        return;
    }

    // 获取题单 ID
    const favoriteSlug = prompt('请输入题单ID（从 URL 中获取，例如：62SpAJ7O）');
    if (!favoriteSlug) {
        console.log('已取消');
        return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        console.error('无法获取 CSRF Token，请确保已登录 LeetCode');
        return;
    }

    console.log(`\n目标题单: ${favoriteSlug}`);
    console.log(`需要导入: ${problemIds.length} 道题目`);

    // 第一步：查询题目 slug
    console.log('\n' + '='.repeat(50));
    console.log('第一步：查询题目');
    console.log('='.repeat(50));

    const slugMap = await fetchAllProblems(csrfToken);

    const foundIds = problemIds.filter(id => slugMap[String(id)]);
    const notFoundIds = problemIds.filter(id => !slugMap[String(id)]);

    console.log(`\n查询结果:`);
    console.log(`  找到: ${foundIds.length}/${problemIds.length}`);
    if (notFoundIds.length > 0) {
        console.warn(`  未找到: ${notFoundIds.join(', ')}`);
    }

    if (foundIds.length === 0) {
        console.error('没有找到任何题目');
        return;
    }

    // 第二步：批量添加
    console.log('\n' + '='.repeat(50));
    console.log('第二步：添加到题单');
    console.log('='.repeat(50));

    const questionSlugs = foundIds.map(id => slugMap[String(id)]);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < questionSlugs.length; i += CONFIG.addBatchSize) {
        const batch = questionSlugs.slice(i, i + CONFIG.addBatchSize);
        const batchNum = Math.floor(i / CONFIG.addBatchSize) + 1;
        const totalBatches = Math.ceil(questionSlugs.length / CONFIG.addBatchSize);

        console.log(`\n批次 ${batchNum}/${totalBatches} (${batch.length} 题)`);

        const result = await batchAddToFavorite(favoriteSlug, batch, csrfToken);

        if (result.data?.batchAddQuestionsToFavorite?.ok) {
            console.log('  成功');
            successCount += batch.length;
        } else {
            console.error('  失败:', result.errors || result.data?.batchAddQuestionsToFavorite?.error);
            failCount += batch.length;
        }

        const progress = Math.round(((i + batch.length) / questionSlugs.length) * 100);
        console.log(`  进度: ${progress}%`);

        await sleep(CONFIG.addDelay);
    }

    // 完成
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(50));
    console.log('完成！');
    console.log('='.repeat(50));
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${failCount}`);
    console.log(`耗时: ${duration}秒`);
    console.log(`题单: https://${HOST}/problem-list/${favoriteSlug}/`);
}

main().catch(console.error);
