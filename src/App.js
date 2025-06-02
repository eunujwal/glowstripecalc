import React, { useState } from 'react';

function App() {
  // State for inputs
  const [monthlyVolume, setMonthlyVolume] = useState(100000);
  const [avgTransaction, setAvgTransaction] = useState(50);
  const [cardType, setCardType] = useState('domestic');

  // Stripe rates
  const rates = {
    domestic: { percent: 2.9, fixed: 0.30 },
    international: { percent: 3.4, fixed: 0.30 }
  };

  // Calculate fees
  const calculateFees = () => {
    const rate = rates[cardType];
    const numTransactions = monthlyVolume / avgTransaction;
    
    const percentageFee = (monthlyVolume * rate.percent) / 100;
    const fixedFees = numTransactions * rate.fixed;
    const totalFees = percentageFee + fixedFees;
    
    return {
      totalFees: totalFees.toFixed(2),
      effectiveRate: ((totalFees / monthlyVolume) * 100).toFixed(2),
      numTransactions: Math.round(numTransactions)
    };
  };

  const results = calculateFees();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            💳 Stripe Fee Calculator
          </h1>
          <p className="text-gray-600 mt-2">
            Calculate your Stripe processing fees instantly
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Enter Your Details</h2>
            
            {/* Monthly Volume */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Processing Volume ($)
              </label>
              <input
                type="number"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Average Transaction */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Transaction Size ($)
              </label>
              <input
                type="number"
                value={avgTransaction}
                onChange={(e) => setAvgTransaction(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Card Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="domestic">Domestic Cards (2.9% + 30¢)</option>
                <option value="international">International Cards (3.4% + 30¢)</option>
              </select>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Your Fees</h2>
            
            {/* Total Fees */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="text-3xl font-bold text-blue-600">
                ${results.totalFees}
              </div>
              <div className="text-sm text-gray-600">Total Monthly Fees</div>
            </div>

            {/* Effective Rate */}
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="text-2xl font-bold text-green-600">
                {results.effectiveRate}%
              </div>
              <div className="text-sm text-gray-600">Effective Rate</div>
            </div>

            {/* Number of Transactions */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {results.numTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Monthly Transactions</div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This calculator provides estimates based on standard Stripe pricing. 
            Actual fees may vary. Large volume businesses may qualify for custom pricing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;