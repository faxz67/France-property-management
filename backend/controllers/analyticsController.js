const { Op } = require('sequelize');
const { Bill, Expense, Budget, Property } = require('../models');

function toMonthString(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

function listMonths(startMonth, endMonth) {
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const result = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y}-${m.toString().padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return result;
}

function parsePropertyIds(param) {
  if (!param || param === 'all') return null;
  return param.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
}

async function overview(req, res) {
  try {
    const adminId = req.admin?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const startMonth = (req.query.startMonth || toMonthString(new Date(new Date().getFullYear(), 0, 1)));
    const endMonth = (req.query.endMonth || toMonthString(new Date()));
    const propertyIds = parsePropertyIds(req.query.propertyIds);
    const categories = (req.query.categories ? String(req.query.categories).split(',').map(s => s.trim()).filter(Boolean) : null);
    const aggregate = String(req.query.aggregate || 'true') === 'true';

    const months = listMonths(startMonth, endMonth);

    const propertyWhere = { admin_id: adminId };
    if (propertyIds) propertyWhere.id = { [Op.in]: propertyIds };
    const properties = await Property.findAll({ where: propertyWhere, attributes: ['id', 'title'] });
    const selectedPropertyIds = properties.map((p) => p.id);

    const billWhere = { admin_id: adminId, month: { [Op.in]: months } };
    if (selectedPropertyIds.length) billWhere.property_id = { [Op.in]: selectedPropertyIds };

    const expenseWhere = { admin_id: adminId, month: { [Op.in]: months } };
    if (selectedPropertyIds.length) expenseWhere.property_id = { [Op.in]: selectedPropertyIds };
    if (categories && categories.length) expenseWhere.category = { [Op.in]: categories };

    const budgetWhere = {};
    if (selectedPropertyIds.length) budgetWhere.property_id = { [Op.in]: selectedPropertyIds };
    budgetWhere.month = { [Op.in]: months };

    const bills = await Bill.findAll({ where: billWhere, attributes: ['id', 'amount', 'month', 'status', 'due_date', 'property_id'] });
    const expenses = await Expense.findAll({ where: expenseWhere, attributes: ['id', 'amount', 'month', 'category', 'property_id'] });
    const budgets = await Budget.findAll({ where: budgetWhere, attributes: ['property_id', 'month', 'budgeted_income', 'budgeted_expenses'] });

    const nowISO = new Date().toISOString().split('T')[0];

    const incomeByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    const expensesByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    const budgetIncomeByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    const budgetExpenseByMonth = Object.fromEntries(months.map((m) => [m, 0]));

    let paidCount = 0, totalCount = 0, overdueAmount = 0;

    for (const b of bills) {
      totalCount += 1;
      if (b.status === 'PAID' || b.status === 'RECEIPT_SENT') {
        paidCount += 1;
        incomeByMonth[b.month] = (incomeByMonth[b.month] || 0) + parseFloat(b.amount);
      }
      if ((b.status === 'PENDING' || b.status === 'OVERDUE') && b.due_date && b.due_date < nowISO) {
        overdueAmount += parseFloat(b.amount);
      }
    }

    for (const e of expenses) {
      expensesByMonth[e.month] = (expensesByMonth[e.month] || 0) + parseFloat(e.amount);
    }

    for (const bud of budgets) {
      budgetIncomeByMonth[bud.month] = (budgetIncomeByMonth[bud.month] || 0) + parseFloat(bud.budgeted_income);
      budgetExpenseByMonth[bud.month] = (budgetExpenseByMonth[bud.month] || 0) + parseFloat(bud.budgeted_expenses);
    }

    const series = {
      incomeByMonth: months.map((m) => ({ month: m, amount: Number(incomeByMonth[m].toFixed(2)) })),
      expensesByMonth: months.map((m) => ({ month: m, amount: Number(expensesByMonth[m].toFixed(2)) })),
      // Net profit = income - expenses
      profitByMonth: months.map((m) => ({ month: m, amount: Number((incomeByMonth[m] - expensesByMonth[m]).toFixed(2)) })),
      netProfitByMonth: months.map((m) => ({ month: m, amount: Number((incomeByMonth[m] - expensesByMonth[m]).toFixed(2)) })),
      budgetVsActualByMonth: months.map((m) => ({
        month: m,
        budgetedIncome: Number((budgetIncomeByMonth[m] || 0).toFixed(2)),
        actualIncome: Number((incomeByMonth[m] || 0).toFixed(2)),
        budgetedExpenses: Number((budgetExpenseByMonth[m] || 0).toFixed(2)),
        actualExpenses: Number((expensesByMonth[m] || 0).toFixed(2))
      }))
    };

    // Per-property breakdown (always calculate for chart display)
    let perProperty = undefined;
    // Calculate per-property data even when aggregate is true (for chart display)
    if (selectedPropertyIds.length > 0) {
      const byProp = new Map();
      // Initialize all selected properties
      for (const pid of selectedPropertyIds) {
        byProp.set(pid, {
          income: Object.fromEntries(months.map(m => [m, 0])),
          expenses: Object.fromEntries(months.map(m => [m, 0])),
          bInc: Object.fromEntries(months.map(m => [m, 0])),
          bExp: Object.fromEntries(months.map(m => [m, 0]))
        });
      }
      
      // Also initialize properties found in bills/expenses (in case some are missing from selection)
      for (const b of bills) {
        if (b.property_id && !byProp.has(b.property_id)) {
          byProp.set(b.property_id, {
            income: Object.fromEntries(months.map(m => [m, 0])),
            expenses: Object.fromEntries(months.map(m => [m, 0])),
            bInc: Object.fromEntries(months.map(m => [m, 0])),
            bExp: Object.fromEntries(months.map(m => [m, 0]))
          });
        }
      }
      for (const e of expenses) {
        if (e.property_id && !byProp.has(e.property_id)) {
          byProp.set(e.property_id, {
            income: Object.fromEntries(months.map(m => [m, 0])),
            expenses: Object.fromEntries(months.map(m => [m, 0])),
            bInc: Object.fromEntries(months.map(m => [m, 0])),
            bExp: Object.fromEntries(months.map(m => [m, 0]))
          });
        }
      }
      for (const b of bills) {
        const group = byProp.get(b.property_id);
        if (group && (b.status === 'PAID' || b.status === 'RECEIPT_SENT')) {
          group.income[b.month] = (group.income[b.month] || 0) + parseFloat(b.amount);
        }
      }
      for (const e of expenses) {
        const group = byProp.get(e.property_id);
        if (group) {
          group.expenses[e.month] = (group.expenses[e.month] || 0) + parseFloat(e.amount);
        }
      }
      for (const bud of budgets) {
        const group = byProp.get(bud.property_id);
        if (group) {
          group.bInc[bud.month] = (group.bInc[bud.month] || 0) + parseFloat(bud.budgeted_income);
          group.bExp[bud.month] = (group.bExp[bud.month] || 0) + parseFloat(bud.budgeted_expenses);
        }
      }
      perProperty = {};
      for (const [pid, group] of byProp.entries()) {
        // Calculate net profit per month (income - expenses)
        const netProfitByMonth = months.map(m => {
          const income = group.income[m] || 0;
          const expenses = group.expenses[m] || 0;
          return { month: m, amount: Number((income - expenses).toFixed(2)) };
        });
        
        // Calculate total profit for this property
        const totalProfit = netProfitByMonth.reduce((sum, item) => sum + item.amount, 0);
        
        perProperty[pid] = {
          incomeByMonth: months.map(m => ({ month: m, amount: Number(group.income[m].toFixed(2)) })),
          expensesByMonth: months.map(m => ({ month: m, amount: Number(group.expenses[m].toFixed(2)) })),
          netProfitByMonth: netProfitByMonth,
          totalProfit: Number(totalProfit.toFixed(2)),
          budgetVsActualByMonth: months.map(m => ({
            month: m,
            budgetedIncome: Number(group.bInc[m].toFixed(2)),
            actualIncome: Number(group.income[m].toFixed(2)),
            budgetedExpenses: Number(group.bExp[m].toFixed(2)),
            actualExpenses: Number(group.expenses[m].toFixed(2))
          }))
        };
      }
    }

    const categoryMap = new Map();
    for (const e of expenses) {
      const key = e.category || 'Uncategorized';
      categoryMap.set(key, (categoryMap.get(key) || 0) + parseFloat(e.amount));
    }
    const expenseBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }));

    const totalIncome = series.incomeByMonth.reduce((s, v) => s + v.amount, 0);
    const totalExpenses = series.expensesByMonth.reduce((s, v) => s + v.amount, 0);
    // Net profit = income - expenses
    const profit = totalIncome - totalExpenses;
    // Budget variance totals (Actual − Budget)
    const totalBudgetedIncome = months.reduce((s,m)=> s + (budgetIncomeByMonth[m]||0), 0);
    const totalBudgetedExpenses = months.reduce((s,m)=> s + (budgetExpenseByMonth[m]||0), 0);
    const budgetVariance = {
      income: Number((totalIncome - totalBudgetedIncome).toFixed(2)),
      expenses: Number((totalExpenses - totalBudgetedExpenses).toFixed(2))
    };
    const onTimeRate = totalCount ? paidCount / totalCount : 0;

    const statCards = {
      totalProperties: properties.length,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(profit.toFixed(2)),
      budgetVariance,
      onTimeRate: Number(onTimeRate.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2))
    };

    res.json({
      success: true,
      filters: {
        startMonth,
        endMonth,
        propertyIds: selectedPropertyIds,
        categories: categories || [],
        aggregate
      },
      statCards,
      series: {
        ...series,
        expenseBreakdown,
        ...(perProperty ? { perProperty } : {})
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics overview', error: error.message });
  }
}

module.exports = { overview };


