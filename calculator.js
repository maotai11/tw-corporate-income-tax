/**
 * 營利事業所得稅計算引擎 (2025年度)
 * 
 * 計算項目：
 * 1. 基本營所稅 20%
 * 2. 未分配盈餘稅 5%
 * 3. 前期虧損扣抵
 */

// ===== 全域變數 =====
let Decimal = null; // 將在 init() 時載入

// ===== 初始化 =====
function initCalculator() {
    // 檢查 Decimal.js 是否已載入
    if (typeof window.Decimal === 'undefined') {
        console.error('Decimal.js 未載入！');
        return false;
    }
    Decimal = window.Decimal;
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
    return true;
}

// ===== 核心計算函數 =====

/**
 * 計算課稅所得額
 */
function calculateTaxableIncome(data) {
    try {
        const revenue = new Decimal(data.revenue || 0);
        const cost = new Decimal(data.cost || 0);
        const expense = new Decimal(data.expense || 0);
        const otherIncome = new Decimal(data.otherIncome || 0);
        const otherExpense = new Decimal(data.otherExpense || 0);
        const priorLoss = new Decimal(data.priorLoss || 0);

        const grossProfit = revenue.minus(cost);
        const operatingIncome = grossProfit.minus(expense);
        const netIncomeBeforeTax = operatingIncome.plus(otherIncome).minus(otherExpense);

        let taxableIncome = netIncomeBeforeTax.minus(priorLoss);
        if (taxableIncome.isNegative()) {
            taxableIncome = new Decimal(0);
        }

        return {
            grossProfit: grossProfit.toNumber(),
            operatingIncome: operatingIncome.toNumber(),
            netIncomeBeforeTax: netIncomeBeforeTax.toNumber(),
            taxableIncome: taxableIncome.toNumber(),
            usedPriorLoss: Decimal.min(priorLoss, netIncomeBeforeTax).toNumber()
        };
    } catch (error) {
        console.error('計算課稅所得額時發生錯誤:', error);
        throw error;
    }
}

/**
 * 計算營所稅（基本稅額 20%）
 */
function calculateCorporateTax(taxableIncome) {
    const income = new Decimal(taxableIncome);
    const taxRate = new Decimal(0.20);
    return income.times(taxRate).toNumber();
}

/**
 * 計算未分配盈餘稅 5%
 */
function calculateUndistributedEarningsTax(data) {
    try {
        const netIncomeAfterTax = new Decimal(data.netIncomeAfterTax || 0);
        const dividendDistributed = new Decimal(data.dividendDistributed || 0);
        const legalReserve = new Decimal(data.legalReserve || 0);

        const deductible = dividendDistributed.plus(legalReserve);

        let undistributedEarnings = netIncomeAfterTax.minus(deductible);
        if (undistributedEarnings.isNegative()) {
            undistributedEarnings = new Decimal(0);
        }

        const taxRate = new Decimal(0.05);
        const tax = undistributedEarnings.times(taxRate);

        return {
            undistributedEarnings: undistributedEarnings.toNumber(),
            tax: tax.toNumber()
        };
    } catch (error) {
        console.error('計算未分配盈餘稅時發生錯誤:', error);
        throw error;
    }
}

/**
 * 完整計算流程
 */
function calculateFullTax(inputData) {
    try {
        const incomeResult = calculateTaxableIncome({
            revenue: inputData.revenue,
            cost: inputData.cost,
            expense: inputData.expense,
            otherIncome: inputData.otherIncome,
            otherExpense: inputData.otherExpense,
            priorLoss: inputData.priorLoss
        });

        const corporateTax = calculateCorporateTax(incomeResult.taxableIncome);

        const netIncomeAfterTax = new Decimal(incomeResult.netIncomeBeforeTax)
            .minus(corporateTax)
            .toNumber();

        const undistributedResult = calculateUndistributedEarningsTax({
            netIncomeAfterTax: netIncomeAfterTax,
            dividendDistributed: inputData.dividendDistributed || 0,
            legalReserve: inputData.legalReserve || 0
        });

        const totalTax = new Decimal(corporateTax)
            .plus(undistributedResult.tax)
            .toNumber();

        return {
            grossProfit: incomeResult.grossProfit,
            operatingIncome: incomeResult.operatingIncome,
            netIncomeBeforeTax: incomeResult.netIncomeBeforeTax,
            usedPriorLoss: incomeResult.usedPriorLoss,
            taxableIncome: incomeResult.taxableIncome,
            corporateTax: corporateTax,
            netIncomeAfterTax: netIncomeAfterTax,
            undistributedEarnings: undistributedResult.undistributedEarnings,
            undistributedEarningsTax: undistributedResult.tax,
            totalTax: totalTax,
            effectiveTaxRate: incomeResult.netIncomeBeforeTax > 0 
                ? (totalTax / incomeResult.netIncomeBeforeTax * 100).toFixed(2)
                : '0.00'
        };
    } catch (error) {
        console.error('完整計算時發生錯誤:', error);
        throw error;
    }
}

// ===== 格式化函數 =====

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    return parseFloat(amount).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatPercent(value) {
    if (value === null || value === undefined) return '0.00%';
    return parseFloat(value).toFixed(2) + '%';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCalculator,
        calculateTaxableIncome,
        calculateCorporateTax,
        calculateUndistributedEarningsTax,
        calculateFullTax,
        formatCurrency,
        formatPercent
    };
}
