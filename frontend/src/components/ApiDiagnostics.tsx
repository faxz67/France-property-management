import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { me, listProperties, listTenants, getBillsStats } from '../api';

interface DiagnosticResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  duration?: number;
}

const ApiDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const tests = [
      {
        name: 'Authentication',
        test: () => me()
      },
      {
        name: 'Properties API',
        test: () => listProperties()
      },
      {
        name: 'Tenants API',
        test: () => listTenants()
      },
      {
        name: 'Bills Stats API',
        test: () => getBillsStats()
      }
    ];

    for (const { name, test } of tests) {
      const startTime = Date.now();
      
      setDiagnostics(prev => [...prev, {
        name,
        status: 'loading',
        message: 'Testing...'
      }]);

      try {
        await test();
        const duration = Date.now() - startTime;
        
        setDiagnostics(prev => prev.map(d => 
          d.name === name 
            ? { name, status: 'success' as const, message: 'OK', duration }
            : d
        ));
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        setDiagnostics(prev => prev.map(d => 
          d.name === name 
            ? { 
                name, 
                status: 'error' as const, 
                message: error.message || 'Failed', 
                duration 
              }
            : d
        ));
      }
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
    
    // Cleanup function to prevent memory leaks
    return () => {
      setIsRunning(false);
      setDiagnostics([]);
    };
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const allComplete = diagnostics.length > 0 && diagnostics.every(d => d.status !== 'loading');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
          API Diagnostics
        </h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Retest'}
        </button>
      </div>

      <div className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(diagnostic.status)}
              <span className="ml-3 font-medium">{diagnostic.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${getStatusColor(diagnostic.status)}`}>
                {diagnostic.message}
              </span>
              {diagnostic.duration && (
                <span className="text-xs text-gray-500">
                  {diagnostic.duration}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {allComplete && (
        <div className="mt-4 p-3 rounded-lg">
          {hasErrors ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 font-medium">Some API endpoints are not responding correctly.</p>
              <p className="text-red-600 text-sm mt-1">
                Check your internet connection and ensure the backend server is running.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">All API endpoints are working correctly!</p>
              <p className="text-green-600 text-sm mt-1">
                Your dashboard should load without issues.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostics;
