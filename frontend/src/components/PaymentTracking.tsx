import React from 'react';
import { CreditCard, TrendingUp, DollarSign } from 'lucide-react';

const PaymentTracking: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Suivi des Paiements</h1>
            <p className="text-green-100 text-lg">Gérez et suivez tous vos paiements en un seul endroit</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
          <CreditCard className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée de paiement</h2>
        <p className="text-gray-600 mb-6">Les paiements apparaîtront ici une fois que vous aurez créé des factures et que les locataires auront effectué des paiements.</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>💡</span>
          <span>Utilisez la section "Factures" pour créer et gérer les factures</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentTracking;
