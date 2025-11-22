import React, { useEffect, useState } from 'react';
import { createExpense, listExpenses, deleteExpense, me, listProperties } from '../api';

const EXPENSE_TYPES = [
  'Electricity Bill',
  'Water Bill',
  'Maintenance',
  'Cleaning & Housekeeping',
  'Property Tax',
  'Security Staff Salary',
  'Gardening / Landscaping',
  'Internet / Wi-Fi',
  'Repairs & Renovations',
  'Waste Management',
  'Insurance',
  'Miscellaneous'
];


const ExpenseAnalytics: React.FC = () => {
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(storedUser?.id ?? null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state for adding expenses (ISOLATED from filter state)
  const [expenseType, setExpenseType] = useState(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPropertyForExpense, setSelectedPropertyForExpense] = useState<number | null>(null);

  // Display filter state (ISOLATED from form state)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  // Property filter for DISPLAY ONLY (separate from form property selection)
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyIdForFilter, setSelectedPropertyIdForFilter] = useState<number | null>(null);

  const fetchExpenses = async () => {
    try {
      const res = await listExpenses();
      const expensesData = res.data?.data?.expenses || [];
      setExpenses(expensesData);
      
      // Log for debugging
      console.log(`📊 Fetched ${expensesData.length} expenses`);
      const withProperty = expensesData.filter((e: any) => e.property_id !== null && e.property_id !== undefined).length;
      const withoutProperty = expensesData.filter((e: any) => e.property_id === null || e.property_id === undefined).length;
      console.log(`   - With property_id: ${withProperty}`);
      console.log(`   - Without property_id (general): ${withoutProperty}`);
    } catch (e: unknown) {
      console.error('Error fetching expenses:', e);
      setExpenses([]);
    }
  };

  useEffect(() => { 
    fetchExpenses();
    fetchProperties();
  }, []);
  
  const fetchProperties = async () => {
    try {
      const res = await listProperties();
      const propertiesData = res.data?.data?.properties || res.data?.data || [];
      setProperties(propertiesData);
    } catch (e: unknown) {
      console.error('Error fetching properties:', e);
      setProperties([]);
    }
  };

  // Ensure we use the server's view of the current admin (token-based)
  useEffect(() => {
    (async () => {
      try {
        const res = await me();
        const adminId = res?.data?.data?.admin?.id ?? null;
        if (adminId != null) setCurrentAdminId(adminId);
      } catch {
        // ignore; fallback to stored user if any
      }
    })();
  }, []);

  // Filter expenses by date range and property (DISPLAY FILTER ONLY)
  useEffect(() => {
    let filtered = expenses;

    // Filter by property - ISOLATE expenses for selected property only
    // This filter is COMPLETELY SEPARATE from the form's property selection
    if (selectedPropertyIdForFilter !== null) {
      // Only show expenses that belong to the selected property
      // Exclude expenses with property_id === null (general expenses)
      filtered = filtered.filter((exp: any) => {
        return exp.property_id === selectedPropertyIdForFilter;
      });
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((exp: unknown) => {
        const expDate = new Date(exp.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return expDate >= start && expDate <= end;
        } else if (start) {
          return expDate >= start;
        } else if (end) {
          return expDate <= end;
        }
        return true;
      });
    }

    setFilteredExpenses(filtered);
  }, [expenses, startDate, endDate, selectedPropertyIdForFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        setError('Amount must be a positive number');
        return;
      }
      const expenseData: any = { 
        type: expenseType, 
        amount: amt, 
        date
      };
      
      // Only include property_id if a property is selected
      // This is COMPLETELY SEPARATE from the display filter
      if (selectedPropertyForExpense !== null && selectedPropertyForExpense > 0) {
        expenseData.property_id = Number(selectedPropertyForExpense);
        console.log(`📝 Creating expense with property_id: ${selectedPropertyForExpense}`);
      } else {
        // Explicitly set to null for general expenses
        expenseData.property_id = null;
        console.log(`📝 Creating general expense (no property)`);
      }
      
      console.log('📤 Sending expense data:', expenseData);
      const response = await createExpense(expenseData);
      console.log('✅ Expense created successfully:', response?.data);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedPropertyForExpense(null);
      await fetchExpenses();
    } catch (e: unknown) {
      setError(e?.userMessage || e?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, exp?: unknown) => {
    const cat = exp?.category || 'Expense';
    const amt = exp?.amount != null ? Number(exp.amount).toFixed(2) : '';
    const when = exp?.created_at ? new Date(exp.created_at).toLocaleDateString() : '';
    const prompt = [
      'Confirm delete',
      cat,
      amt ? `€${amt}` : '',
      when ? `on ${when}` : ''
    ].filter(Boolean).join(' ');
    if (!window.confirm(`${prompt}? This cannot be undone.`)) {
      return;
    }
    
    console.log('[ExpenseAnalytics] Deleting expense ID:', id);
    
    try {
      setError('');
      setLoading(true);
      
      const response = await deleteExpense(id);
      console.log('[ExpenseAnalytics] Delete response:', response);
      
      // Refresh the list
      await fetchExpenses();
      console.log('[ExpenseAnalytics] Expense deleted and list refreshed');
    } catch (e: unknown) {
      console.error('[ExpenseAnalytics] Delete failed:', e);
      console.error('[ExpenseAnalytics] Error response:', e?.response);
      
      const status = e?.response?.status;
      let errorMsg = e?.response?.data?.error || e?.userMessage || e?.message || 'Failed to delete expense';
      if (status === 404) {
        errorMsg = 'Expense not found or access denied (data isolation)';
      } else if (status === 403) {
        errorMsg = 'Access denied: this expense belongs to another admin';
      }
      setError(errorMsg);
      alert(`Delete failed: ${errorMsg}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
      // sync UI in case of cross-admin item present in list
      try { 
        await fetchExpenses(); 
      } catch {
        // Ignore error
      }
    } finally {
      setLoading(false);
    }
  };

  // Use filtered expenses for calculations
  // Only use filteredExpenses when a filter is active (property, date range, or both)
  const displayExpenses = (selectedPropertyIdForFilter !== null || startDate || endDate) ? filteredExpenses : expenses;

  // Compute summary stats
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const monthlyExpenses = displayExpenses.filter((exp: unknown) => {
    const d = new Date(exp.created_at);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === currentMonth;
  });
  
  const totalMonthly = monthlyExpenses.reduce((s: number, e: unknown) => s + Number((e as { amount?: number }).amount || 0), 0);
  
  const typeMap: Record<string, number> = {};
  displayExpenses.forEach((exp: unknown) => {
    const cat = exp.category || 'Miscellaneous';
    typeMap[cat] = (typeMap[cat] || 0) + Number(exp.amount || 0);
  });
  
  const highestType = Object.keys(typeMap).length > 0
    ? Object.keys(typeMap).reduce((a, b) => typeMap[a] > typeMap[b] ? a : b)
    : 'N/A';
  
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgDaily = totalMonthly / daysInMonth;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord d'Analyse des Dépenses</h1>

      {/* Expense Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">➕ Ajouter une Dépense</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez une propriété pour isoler les charges par propriété, ou laissez vide pour une dépense générale.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de Dépense</label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏠 Propriété <span className="text-gray-500 text-xs">(Pour isoler les charges)</span>
            </label>
            <select
              value={selectedPropertyForExpense || ''}
              onChange={(e) => setSelectedPropertyForExpense(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">🌐 Aucune propriété (Dépense Générale)</option>
              {properties.map((prop: any) => (
                <option key={prop.id} value={prop.id}>
                  🏠 {prop.title || prop.name || `Propriété ${prop.id}`}
                </option>
              ))}
            </select>
            {selectedPropertyForExpense && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Les charges seront isolées pour cette propriété uniquement
              </p>
            )}
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Ajouter Dépense'}
          </button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">🔍 Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Filtrer par Propriété <span className="text-gray-500 text-xs">(Affichage uniquement)</span>
            </label>
            <select
              value={selectedPropertyIdForFilter || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedPropertyIdForFilter(value ? parseInt(value) : null);
                console.log(`🔍 Display filter changed to property: ${value || 'all'}`);
              }}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">Toutes les propriétés (Afficher toutes les dépenses)</option>
              {properties.map((prop: any) => (
                <option key={prop.id} value={prop.id}>
                  🏠 {prop.title || prop.name || `Propriété ${prop.id}`}
                </option>
              ))}
            </select>
            {selectedPropertyIdForFilter && (
              <p className="text-xs text-purple-600 mt-1">
                ✓ Affichage filtré pour cette propriété uniquement
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de Début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedPropertyIdForFilter(null);
                console.log('🔍 Display filters cleared');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Effacer les Filtres
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              {(startDate || endDate || selectedPropertyIdForFilter !== null) ? (
                <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded">
                  {displayExpenses.length} dépense(s) affichée(s)
                </span>
              ) : (
                <span className="text-gray-500 px-3 py-2">
                  Toutes les {expenses.length} dépenses
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Dépense Mensuelle Totale</div>
          <div className="text-2xl font-semibold">€{totalMonthly.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Type de Dépense le Plus Élevé</div>
          <div className="text-xl font-semibold">{highestType}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Dépense Quotidienne Moyenne</div>
          <div className="text-2xl font-semibold">€{avgDaily.toFixed(2)}</div>
        </div>
      </div>

      {/* Expense List with Delete */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Dépenses</h2>
        {displayExpenses.length === 0 ? (
          <div className="text-gray-500">Aucune dépense à afficher</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Mois</th>
                  <th className="py-2 pr-4">Propriété</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayExpenses.map((exp: unknown) => {
                  // Get property name for display
                  const expProperty = exp.property_id 
                    ? properties.find((p: any) => p.id === exp.property_id)
                    : null;
                  const propertyName = expProperty 
                    ? (expProperty.title || expProperty.name || `Propriété ${exp.property_id}`)
                    : 'Général';
                  
                  return (
                    <tr key={exp.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{new Date(exp.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{exp.category}</td>
                      <td className="py-2 pr-4">€{Number(exp.amount || 0).toFixed(2)}</td>
                      <td className="py-2 pr-4">{exp.month}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          exp.property_id 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exp.property_id ? `🏠 ${propertyName}` : '🌐 Général'}
                        </span>
                      </td>
                      <td className="py-2">
                        {currentAdminId != null && exp.admin_id === currentAdminId ? (
                          <button
                            onClick={() => handleDelete(exp.id, exp)}
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Supprimer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">Pas le vôtre</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ExpenseAnalytics;

