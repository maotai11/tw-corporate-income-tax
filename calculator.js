/**
 * 營利事業所得稅計算引擎 (2025年度)
 * 
 * 支援三種申報方式：
 * 1. 書審申報（擴大書審制度）
 * 2. 所得額標準申報
 * 3. 查帳申報/簽證申報
 */

// ===== 全域變數 =====
let Decimal = null;

// ===== 初始化 =====
function initCalculator() {
    if (typeof window.Decimal === 'undefined') {
        console.error('Decimal.js 未載入！');
        return false;
    }
    Decimal = window.Decimal;
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
    return true;
}

// ===== 書審純益率表 (簡化版) =====
const BOOK_REVIEW_RATES = {
    '批發業': 0.01,
    '零售業': 0.03,
    '餐飲業': 0.06,
    '服務業': 0.08,
    '製造業': 0.04,
    '營造業': 0.05,
    '資訊業': 0.10,
    '其他': 0.06
};

// ===== 所得額標準率表 (簡化版) =====
const INCOME_STANDARD_RATES = {
    '批發業': 0.10,
    '零售業': 0.15,
    '餐飲業': 0.20,
    '服務業': 0.30,
    '製造業': 0.18,
    '營造業': 0.25,
    '資訊業': 0.35,
    '其他': 0.25
};

// ===== 核心計算函數 =====

/**
 * 計算營所稅 (統一入口)
 * @param {Object} params - 計算參數
 * @returns {Object} 計算結果
 */
function calculateCorporateTax(params) {
    const {
        filingMethod,      // 'book' | 'standard' | 'audit'
        revenue,           // 營業收入
        industry,          // 行業別
        customRate,        // 自訂稅率 (書審/所得額標準用)
        
        // 查帳用
        accountingProfit,  // 會計淨利
        nonDeductible,     // 不可扣除費用
        additionalDeduct,  // 額外可扣除
        priorLosses        // 前期虧損
    } = params;

    const rev = new Decimal(revenue || 0);
    
    let taxableIncome;
    let details = {};

    // === 1. 書審申報 ===
    if (filingMethod === 'book') {
        const rate = customRate || BOOK_REVIEW_RATES[industry] || 0.06;
        taxableIncome = rev.times(rate);
        
        details = {
            method: '書審申報',
            revenue: rev.toFixed(0),
            rate: (rate * 100).toFixed(2) + '%',
            taxableIncome: taxableIncome.toFixed(0),
            notes: '⚠️ 書審不可列虧損，實際毛利低於書審率稅負較重'
        };
    }
    
    // === 2. 所得額標準申報 ===
    else if (filingMethod === 'standard') {
        const rate = customRate || INCOME_STANDARD_RATES[industry] || 0.25;
        taxableIncome = rev.times(rate);
        
        details = {
            method: '所得額標準申報',
            revenue: rev.toFixed(0),
            rate: (rate * 100).toFixed(2) + '%',
            taxableIncome: taxableIncome.toFixed(0),
            notes: '⚠️ 稅率較高，適合完全沒帳或不想補帳的情況'
        };
    }
    
    // === 3. 查帳申報 ===
    else if (filingMethod === 'audit') {
        const profit = new Decimal(accountingProfit || 0);
        const nonDed = new Decimal(nonDeductible || 0);
        const addDed = new Decimal(additionalDeduct || 0);
        const losses = new Decimal(priorLosses || 0);
        
        taxableIncome = profit.plus(nonDed).minus(addDed).minus(losses);
        
        // 課稅所得不可為負
        if (taxableIncome.isNegative()) {
            taxableIncome = new Decimal(0);
        }
        
        details = {
            method: '查帳申報/簽證申報',
            accountingProfit: profit.toFixed(0),
            nonDeductible: nonDed.toFixed(0),
            additionalDeduct: addDed.toFixed(0),
            priorLosses: losses.toFixed(0),
            taxableIncome: taxableIncome.toFixed(0),
            notes: '✓ 可列虧損、可扣前期虧損、查帳風險最低'
        };
    }
    
    else {
        throw new Error('未指定申報方式');
    }

    // === 計算營所稅 (20%) ===
    const basicTax = taxableIncome.times(0.20);
    
    // === 計算未分配盈餘稅 (5%) ===
    // 簡化：假設全部未分配
    const undistributedTax = taxableIncome.times(0.05);
    
    // === 總稅額 ===
    const totalTax = basicTax.plus(undistributedTax);

    return {
        ...details,
        basicTax: basicTax.toFixed(0),
        undistributedTax: undistributedTax.toFixed(0),
        totalTax: totalTax.toFixed(0),
        effectiveRate: rev.isZero() ? '0.00%' : 
            totalTax.dividedBy(rev).times(100).toFixed(2) + '%'
    };
}

/**
 * 取得行業別清單
 */
function getIndustryList() {
    return Object.keys(BOOK_REVIEW_RATES);
}

/**
 * 取得書審純益率
 */
function getBookReviewRate(industry) {
    return BOOK_REVIEW_RATES[industry] || 0.06;
}

/**
 * 取得所得額標準率
 */
function getIncomeStandardRate(industry) {
    return INCOME_STANDARD_RATES[industry] || 0.25;
}

/**
 * 格式化金額（千分位逗號）
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    return parseFloat(amount).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * 格式化百分比
 */
function formatPercent(value) {
    if (value === null || value === undefined) return '0.00%';
    return parseFloat(value).toFixed(2) + '%';
}

// ===== 匯出 =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCalculator,
        calculateCorporateTax,
        getIndustryList,
        getBookReviewRate,
        getIncomeStandardRate,
        formatCurrency,
        formatPercent
    };
}
