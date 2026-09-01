/**
 * LeetCode 批量导入题单工具
 * 
 * 一个简洁高效的 LeetCode 题单批量导入脚本，支持将任意题号列表批量添加到自定义题单。
 * 
 * 功能特性：
 * - ✅ 自动分页查询所有题目（突破100题限制）
 * - ✅ 批量添加题目到自定义题单
 * - ✅ 实时进度显示
 * - ✅ 完整的错误处理
 * - ✅ 防止请求过快被限流
 * 
 * 使用方法：
 * 1. 在 leetcode.cn 登录你的账号
 * 2. 打开开发者工具 (F12) -> Console
 * 3. 修改下方 PROBLEM_IDS 为你的题号列表
 * 4. 粘贴脚本并运行
 * 5. 输入你的题单ID
 * 
 * @author Your Name
 * @license MIT
 * @version 2.0.0
 */

// ============================================
// 📝 配置区域 - 在这里修改你的题目列表
// ============================================

/**
 * 需要导入的题目ID列表
 * 
 * 示例：
 * const PROBLEM_IDS = [1, 2, 3, 15, 42, 100];
 * 
 * 获取题号的方法：
 * - 在LeetCode题目页面，URL中的数字就是题号
 * - 例如：https://leetcode.cn/problems/two-sum/ 中的 "two-sum" 对应题号 1
 */
const PROBLEM_IDS = [
    // 在这里填入你的题号列表
    // 例如：1, 2, 3, 15, 42, 100, 200, 500
];

// ============================================
// ⚙️ 高级配置（可选）
// ============================================

const CONFIG = {
    // GraphQL API端点
    endpoint: 'https://leetcode.cn/graphql/',
    
    // 分页查询配置
    pageSize: 100,              // 每页查询数量（最大100）
    queryDelay: 300,            // 查询间隔（毫秒）
    
    // 批量添加配置
    addBatchSize: 20,           // 每批添加数量
    addDelay: 1000,             // 添加间隔（毫秒）
};

// ============================================
// 🔧 核心代码（通常不需要修改）
// ============================================

/**
 * 从Cookie获取CSRF Token
 */
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

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 分页查询所有题目，返回题号到slug的映射
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
    
    const slugMap = {};
    let skip = 0;
    let total = 0;
    
    console.log('📋 查询题目列表...');
    
    // 首次查询获取总数
    try {
        const response = await fetch(CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.cn/problemset/',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                query,
                variables: { categorySlug: '', skip: 0, limit: CONFIG.pageSize, filters: {} }
            })
        });
        
        const data = await response.json();
        if (data.data?.problemsetQuestionList) {
            total = data.data.problemsetQuestionList.total;
            for (const q of data.data.problemsetQuestionList.questions) {
                slugMap[q.frontendQuestionId] = q.titleSlug;
            }
            console.log(`   总数: ${total}，已获取: ${Object.keys(slugMap).length}`);
        }
    } catch (error) {
        console.error('❌ 首次查询失败:', error);
        return slugMap;
    }
    
    // 分页查询
    skip = CONFIG.pageSize;
    while (skip < total) {
        console.log(`   查询 ${skip + 1}-${Math.min(skip + CONFIG.pageSize, total)}...`);
        
        try {
            const response = await fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.cn/problemset/',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    query,
                    variables: { categorySlug: '', skip, limit: CONFIG.pageSize, filters: {} }
                })
            });
            
            const data = await response.json();
            if (data.data?.problemsetQuestionList) {
                for (const q of data.data.problemsetQuestionList.questions) {
                    slugMap[q.frontendQuestionId] = q.titleSlug;
                }
            }
            
            await sleep(CONFIG.queryDelay);
        } catch (error) {
            console.error(`   ❌ 查询失败:`, error);
        }
        
        skip += CONFIG.pageSize;
    }
    
    console.log(`✅ 查询完成，共 ${Object.keys(slugMap).length} 个题目`);
    return slugMap;
}

/**
 * 批量添加题目到题单
 */
async function batchAddQuestions(favoriteSlug, questionSlugs, csrfToken) {
    const query = `
        mutation batchAddQuestionsToFavorite($favoriteSlug: String!, $questionSlugs: [String]!) {
            batchAddQuestionsToFavorite(favoriteSlug: $favoriteSlug, questionSlugs: $questionSlugs) {
                ok
                error
            }
        }
    `;
    
    try {
        const response = await fetch(CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': `https://leetcode.cn/problem-list/${favoriteSlug}/`,
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                query,
                variables: { favoriteSlug, questionSlugs }
            })
        });
        
        return await response.json();
    } catch (error) {
        return { errors: [error.message] };
    }
}

/**
 * 主函数
 */
async function main() {
    const startTime = Date.now();
    
    console.log('🚀 LeetCode 批量导入题单工具 v2.0.0');
    console.log('='.repeat(50));
    
    // 验证配置
    if (!PROBLEM_IDS || PROBLEM_IDS.length === 0) {
        console.error('❌ 请先配置 PROBLEM_IDS 列表！');
        console.log('💡 提示：在脚本顶部的 PROBLEM_IDS 数组中填入你的题号');
        return;
    }
    
    // 获取题单ID
    const favoriteSlug = prompt('请输入题单ID（从URL中获取，例如：62SpAJ7O）');
    if (!favoriteSlug) {
        console.log('❌ 取消操作');
        return;
    }
    
    // 获取CSRF Token
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        console.error('❌ 无法获取CSRF Token，请确保已登录LeetCode');
        return;
    }
    
    console.log(`\n📝 目标题单: ${favoriteSlug}`);
    console.log(`📝 需要导入: ${PROBLEM_IDS.length} 道题目`);
    
    // 第一步：查询题目
    console.log('\n' + '='.repeat(50));
    console.log('第一步：查询题目');
    console.log('='.repeat(50));
    
    const slugMap = await fetchAllProblems(csrfToken);
    
    // 统计
    const foundIds = PROBLEM_IDS.filter(id => slugMap[String(id)]);
    const notFoundIds = PROBLEM_IDS.filter(id => !slugMap[String(id)]);
    
    console.log(`\n📊 查询结果:`);
    console.log(`   ✅ 找到: ${foundIds.length}/${PROBLEM_IDS.length}`);
    if (notFoundIds.length > 0) {
        console.log(`   ⚠️  未找到: ${notFoundIds.join(', ')}`);
    }
    
    if (foundIds.length === 0) {
        console.error('\n❌ 没有找到任何题目');
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
        
        console.log(`\n📦 批次 ${batchNum}/${totalBatches}`);
        
        const result = await batchAddQuestions(favoriteSlug, batch, csrfToken);
        
        if (result.data?.batchAddQuestionsToFavorite?.ok) {
            console.log('   ✅ 成功');
            successCount += batch.length;
        } else {
            console.error('   ❌ 失败:', result.errors || result.data?.batchAddQuestionsToFavorite?.error);
            failCount += batch.length;
        }
        
        const progress = Math.round(((i + batch.length) / questionSlugs.length) * 100);
        console.log(`   📊 进度: ${progress}%`);
        
        await sleep(CONFIG.addDelay);
    }
    
    // 完成
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 完成！');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`⏱️  耗时: ${duration}秒`);
    console.log(`🔗 题单: https://leetcode.cn/problem-list/${favoriteSlug}/`);
}

// 运行
main().catch(console.error);