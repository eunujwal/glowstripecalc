import React, { useState } from 'react';

function App() {
  // State for inputs
  const [monthlyVolume, setMonthlyVolume] = useState(100000);
  const [avgTransaction, setAvgTransaction] = useState(50);
  const [cardType, setCardType] = useState('domestic');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currency, setCurrency] = useState('usd');
  
  // Additional features
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [internationalCards, setInternationalCards] = useState(10); // percentage
  const [disputeRate, setDisputeRate] = useState(0.1); // percentage
  const [instantPayouts, setInstantPayouts] = useState(false);

  // Comprehensive Stripe rates
  const rates = {
    card: {
      domestic: { percent: 2.9, fixed: 0.30 },
      international: { percent: 3.4, fixed: 0.30 },
      currencyConversion: 1.0, // additional 1%
      manualEntry: { percent: 3.4, fixed: 0.30 }
    },
    ach: {
      percent: 0.8,
      fixed: 0,
      cap: 5.00
    },
    link: {
      card: { percent: 2.9, fixed: 0.30 },
      bankAccount: { percent: 2.6, fixed: 0.30 }
    },
    wallets: { // Apple Pay, Google Pay
      percent: 2.9,
      fixed: 0.30
    },
    instantPayout: {
      percent: 1.5,
      minimum: 0.50
    },
    dispute: {
      fee: 15.00
    },
    radar: {
      perTransaction: 0.05, // waived for standard pricing
      fraudTeams: 0.07
    }
  };

  // Calculate fees
  const calculateFees = () => {
    const numTransactions = monthlyVolume / avgTransaction;
    let totalFees = 0;
    let breakdown = {};

    // Base card processing
    if (paymentMethod === 'card') {
      const domesticVolume = monthlyVolume * (1 - internationalCards / 100);
      const intlVolume = monthlyVolume * (internationalCards / 100);
      
      // Domestic cards
      const domesticFees = (domesticVolume * rates.card.domestic.percent) / 100 + 
                          (numTransactions * (1 - internationalCards / 100) * rates.card.domestic.fixed);
      
      // International cards
      const intlFees = (intlVolume * rates.card.international.percent) / 100 + 
                      (numTransactions * (internationalCards / 100) * rates.card.international.fixed);
      
      // Currency conversion (assume 20% of international needs conversion)
      const currencyFees = intlVolume * 0.2 * rates.card.currencyConversion / 100;
      
      breakdown.cardProcessing = domesticFees + intlFees;
      breakdown.currencyConversion = currencyFees;
      totalFees += domesticFees + intlFees + currencyFees;
    }

    // ACH processing
    if (paymentMethod === 'ach') {
      const achFeePerTransaction = Math.min(avgTransaction * rates.ach.percent / 100, rates.ach.cap);
      breakdown.achProcessing = numTransactions * achFeePerTransaction;
      totalFees += breakdown.achProcessing;
    }

    // Radar fees (only if not included free)
    if (radarEnabled && paymentMethod === 'card') {
      breakdown.fraudProtection = numTransactions * rates.radar.perTransaction;
      totalFees += breakdown.fraudProtection;
    }

    // Dispute fees
    const disputeCount = numTransactions * (disputeRate / 100);
    breakdown.disputes = disputeCount * rates.dispute.fee;
    totalFees += breakdown.disputes;

    // Instant payout fees
    if (instantPayouts) {
      const payoutFee = Math.max(monthlyVolume * rates.instantPayout.percent / 100, 
                                rates.instantPayout.minimum * 30); // assume daily payouts
      breakdown.instantPayouts = payoutFee;
      totalFees += payoutFee;
    }

    return {
      totalFees: totalFees.toFixed(2),
      effectiveRate: ((totalFees / monthlyVolume) * 100).toFixed(3),
      numTransactions: Math.round(numTransactions),
      breakdown: breakdown,
      netRevenue: (monthlyVolume - totalFees).toFixed(2)
    };
  };

  const results = calculateFees();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            💳 Advanced Stripe Fee Calculator
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive fee calculation based on official Stripe pricing
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Input Section - Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Inputs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
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

                <div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="card">Credit/Debit Cards</option>
                    <option value="ach">ACH Direct Debit</option>
                    <option value="link">Link (Stripe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    International Cards (%)
                  </label>
                  <input
                    type="number"
                    value={internationalCards}
                    onChange={(e) => setInternationalCards(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Additional Features</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Radar Fraud Protection</label>
                    <p className="text-sm text-gray-500">+$0.05 per transaction</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={radarEnabled}
                    onChange={(e) => setRadarEnabled(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Instant Payouts</label>
                    <p className="text-sm text-gray-500">1.5% per payout (min $0.50)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={instantPayouts}
                    onChange={(e) => setInstantPayouts(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Dispute Rate (%)
                  </label>
                  <input
                    type="number"
                    value={disputeRate}
                    onChange={(e) => setDisputeRate(Number(e.target.value))}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">$15 per dispute</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section - Right */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-6">Monthly Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">${results.totalFees}</div>
                  <div className="text-blue-100">Total Fees</div>
                </div>
                
                <div className="pt-4 border-t border-blue-500">
                  <div className="text-2xl font-bold">{results.effectiveRate}%</div>
                  <div className="text-blue-100">Effective Rate</div>
                </div>
                
                <div className="pt-4 border-t border-blue-500">
                  <div className="text-2xl font-bold">${results.netRevenue}</div>
                  <div className="text-blue-100">Net Revenue</div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3>
              
              <div className="space-y-3">
                {Object.entries(results.breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="font-medium">${value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Discount Alert */}
            {monthlyVolume > 80000 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💡</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Volume Discount Available</h4>
                    <p className="text-sm text-green-700 mt-1">
                      With ${(monthlyVolume).toLocaleString()} monthly volume, you may qualify for custom pricing. 
                      Contact Stripe sales for potential savings.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💳 Standard Pricing Includes</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• No setup, monthly, or hidden fees</li>
              <li>• 100+ features out of the box</li>
              <li>• 135+ currencies supported</li>
              <li>• 24×7 phone, chat, and email support</li>
              <li>• Fast, predictable payouts</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Estimates based on standard pricing</li>
              <li>• Custom pricing available for large volumes</li>
              <li>• Additional fees may apply for some features</li>
              <li>• ACH Direct Debit capped at $5 per transaction</li>
              <li>• Currency conversion adds 1% to international</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;