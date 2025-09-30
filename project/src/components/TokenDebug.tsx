import React, { useState } from 'react';
// @ts-ignore
import api from '../api.js';

const TokenDebug: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    setLoading(true);
    try {
      const response = await api.get('/test-token');
      setResult(response.data);
    } catch (error: any) {
      setResult({ error: error.message, response: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setResult(response.data);
    } catch (error: any) {
      setResult({ error: error.message, response: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setResult({ message: 'Token cleared' });
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Token Debug</h3>
      
      <div className="space-y-2 mb-4">
        <div>
          <strong>Token in localStorage:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}
        </div>
        <div>
          <strong>User in localStorage:</strong> {localStorage.getItem('user') ? 'Present' : 'Missing'}
        </div>
        <div>
          <strong>Token preview:</strong> {localStorage.getItem('token')?.substring(0, 20)}...
        </div>
      </div>

      <div className="space-x-2 mb-4">
        <button 
          onClick={testToken}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Token Endpoint
        </button>
        <button 
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Auth/Me
        </button>
        <button 
          onClick={clearToken}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Token
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Result:</h4>
          <pre className="bg-white p-3 rounded border text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TokenDebug;
