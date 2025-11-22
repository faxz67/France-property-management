import React, { useEffect, useState } from 'react';
import { listExpenses, listProperties } from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6361', '#BC5090', '#58508D', '#003F5C', '#665191'];

const ExpenseAnalysis: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filter for viewing expenses
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  // Property filter for ANALYTICS ONLY (COMPLETELY ISOLATED from ExpenseAnalytics)
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyIdForAnalytics, setSelectedPropertyIdForAnalytics] = useState<number | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await listExpenses();
      setExpenses(res.data?.data?.expenses || []);
    } catch (e: unknown) {
      console.error('Error fetching expenses:', e);
      setExpenses([]);
    } finally {
      setLoading(false);
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

  // Filter expenses by date range and property
  useEffect(() => {
    let filtered = expenses;

    // Filter by property - ISOLATE expenses for selected property only
    // This is COMPLETELY SEPARATE from ExpenseAnalytics filter
    if (selectedPropertyIdForAnalytics !== null) {
      // Only show expenses that belong to the selected property
      // Exclude expenses with property_id === null (general expenses)
      filtered = filtered.filter((exp: any) => {
        return exp.property_id === selectedPropertyIdForAnalytics;
      });
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((exp: any) => {
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
  }, [expenses, startDate, endDate, selectedPropertyIdForAnalytics]);

  // Use filtered expenses for calculations
  // When a property is selected, ONLY show expenses for that property (isolated)
  // Always use filteredExpenses when a property is selected, even if empty
  // This is COMPLETELY ISOLATED from ExpenseAnalytics
  const displayExpenses = (selectedPropertyIdForAnalytics !== null || startDate || endDate) 
    ? filteredExpenses 
    : expenses;

  // Compute chart data
  const typeMap: Record<string, number> = {};
  displayExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Miscellaneous';
    typeMap[cat] = (typeMap[cat] || 0) + Number(exp.amount || 0);
  });

  // Pie chart data - Expense by type
  const pieData = Object.keys(typeMap).map(cat => ({ name: cat, value: typeMap[cat] }));

  // Pie chart data - Monthly distribution (last 6 months)
  const monthlyDistribution: Record<string, number> = {};
  displayExpenses.forEach((exp: any) => {
    const m = exp.month || 'Unknown';
    monthlyDistribution[m] = (monthlyDistribution[m] || 0) + Number(exp.amount || 0);
  });
  const last6Months = Object.keys(monthlyDistribution).sort().slice(-6);
  const monthlyPieData = last6Months.map(m => ({ name: m, value: monthlyDistribution[m] }));

  // Pie chart data - Expense range categories
  const expenseRanges: Record<string, number> = {
    'Under €50': 0,
    '€50 - €100': 0,
    '€100 - €500': 0,
    'Over €500': 0
  };
  displayExpenses.forEach((exp: any) => {
    const amt = Number(exp.amount || 0);
    if (amt < 50) expenseRanges['Under €50']++;
    else if (amt < 100) expenseRanges['€50 - €100']++;
    else if (amt < 500) expenseRanges['€100 - €500']++;
    else expenseRanges['Over €500']++;
  });
  const rangePieData = Object.keys(expenseRanges).map(range => ({ name: range, value: expenseRanges[range] })).filter(d => d.value > 0);

  // Bar chart data (by day for current month)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const monthlyExpenses = displayExpenses.filter((exp: any) => {
    const d = new Date(exp.created_at);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === currentMonth;
  });

  const dayMap: Record<string, number> = {};
  monthlyExpenses.forEach((exp: any) => {
    const d = new Date(exp.created_at);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dayMap[day] = (dayMap[day] || 0) + Number(exp.amount || 0);
  });
  const barData = Object.keys(dayMap).sort().map(day => ({ date: day, amount: dayMap[day] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des données...</div>
      </div>
    );
  }

  // Get selected property name for display (ANALYTICS ONLY)
  const selectedProperty = properties.find((p: any) => p.id === selectedPropertyIdForAnalytics);
  const propertyDisplayName = selectedProperty 
    ? (selectedProperty.title || selectedProperty.name || `Propriété ${selectedPropertyIdForAnalytics}`)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📊 Analyse des Dépenses</h1>
        {selectedPropertyIdForAnalytics !== null && propertyDisplayName && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
            🏠 Analyse pour: {propertyDisplayName}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">🔍 Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📊 Sélectionner une Propriété pour l'Analyse <span className="text-gray-500 text-xs">(Isolé)</span>
            </label>
            <select
              value={selectedPropertyIdForAnalytics || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedPropertyIdForAnalytics(value ? parseInt(value) : null);
                console.log(`📊 Analytics filter changed to property: ${value || 'all'}`);
              }}
              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Toutes les propriétés (Toutes les dépenses)</option>
              {properties.map((prop: any) => (
                <option key={prop.id} value={prop.id}>
                  🏠 {prop.title || prop.name || `Propriété ${prop.id}`}
                </option>
              ))}
            </select>
            {selectedPropertyIdForAnalytics && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Analyse isolée pour cette propriété uniquement
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
                setSelectedPropertyIdForAnalytics(null);
                console.log('📊 Analytics filters cleared');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Effacer les Filtres
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              {selectedPropertyIdForAnalytics !== null ? (
                <span className="bg-green-100 text-green-800 px-3 py-2 rounded font-semibold">
                  🏠 {displayExpenses.length} dépense(s) pour {propertyDisplayName || 'cette propriété'}
                  {displayExpenses.length === 0 && (
                    <span className="ml-2 text-xs">(Aucune dépense pour cette propriété)</span>
                  )}
                </span>
              ) : (startDate || endDate) ? (
                <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded">
                  {displayExpenses.length} dépense(s) affichée(s)
                </span>
              ) : (
                <span className="text-gray-500 px-3 py-2">
                  Toutes les {expenses.length} dépenses (toutes propriétés)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart 1 - By Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            💰 Répartition des Dépenses par Type
            {selectedPropertyIdForAnalytics !== null && propertyDisplayName && (
              <span className="text-sm font-normal text-gray-600 ml-2">({propertyDisplayName})</span>
            )}
          </h3>
          {selectedPropertyIdForAnalytics !== null && displayExpenses.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              <p className="font-semibold mb-2">Aucune dépense pour cette propriété</p>
              <p className="text-sm">Sélectionnez une autre propriété ou ajoutez des dépenses</p>
            </div>
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center py-12">Aucune donnée de dépense encore</div>
          )}
        </div>

        {/* Pie Chart 2 - By Month */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            📅 Distribution Mensuelle (6 Derniers Mois)
            {selectedPropertyIdForAnalytics !== null && propertyDisplayName && (
              <span className="text-sm font-normal text-gray-600 ml-2">({propertyDisplayName})</span>
            )}
          </h3>
          {selectedPropertyIdForAnalytics !== null && displayExpenses.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              <p className="font-semibold mb-2">Aucune dépense pour cette propriété</p>
              <p className="text-sm">Sélectionnez une autre propriété ou ajoutez des dépenses</p>
            </div>
          ) : monthlyPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={monthlyPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {monthlyPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center py-12">Aucune donnée mensuelle disponible</div>
          )}
        </div>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart 3 - By Amount Range */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            📊 Nombre de Dépenses par Plage de Montant
            {selectedPropertyIdForAnalytics !== null && propertyDisplayName && (
              <span className="text-sm font-normal text-gray-600 ml-2">({propertyDisplayName})</span>
            )}
          </h3>
          {selectedPropertyIdForAnalytics !== null && displayExpenses.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              <p className="font-semibold mb-2">Aucune dépense pour cette propriété</p>
              <p className="text-sm">Sélectionnez une autre propriété ou ajoutez des dépenses</p>
            </div>
          ) : rangePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={rangePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {rangePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center py-12">Aucune donnée de plage disponible</div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            📈 Tendance des Dépenses Quotidiennes (Mois Actuel)
            {selectedPropertyIdForAnalytics !== null && propertyDisplayName && (
              <span className="text-sm font-normal text-gray-600 ml-2">({propertyDisplayName})</span>
            )}
          </h3>
          {selectedPropertyIdForAnalytics !== null && displayExpenses.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              <p className="font-semibold mb-2">Aucune dépense pour cette propriété</p>
              <p className="text-sm">Sélectionnez une autre propriété ou ajoutez des dépenses</p>
            </div>
          ) : barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center py-12">Aucune donnée de dépense pour ce mois</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalysis;

