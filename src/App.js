import React, { useState } from 'react';

function App() {
  // State for inputs
  const [monthlyVolume, setMonthlyVolume] = useState(100000);
  const [avgTransaction, setAvgTransaction] = useState(50);
  
  // Payment method volumes (as percentages)
  const [paymentVolumes, setPaymentVolumes] = useState({
    domesticCards: 70,
    internationalCards: 10,
    ach: 10,
    stablecoins: 10
  });
  
  // Additional features
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [disputeRate, setDisputeRate] = useState(0.1); // percentage
  const [instantPayouts, setInstantPayouts] = useState(false);
  const [stablecoinNetwork, setStablecoinNetwork] = useState('efficient'); // efficient or standard
  const [stablecoinGateway, setStablecoinGateway] = useState('stripe'); // stripe or other
  const [requiresConversion, setRequiresConversion] = useState(true); // fiat conversion needed
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(1);
  };
  // Comprehensive rates including stablecoins
  const rates = {
    card: {
      domestic: { percent: 2.9, fixed: 0.30 },
      international: { percent: 3.4, fixed: 0.30 },
      currencyConversion: 1.0, // additional 1%
    },
    ach: {
      percent: 0.8,
      fixed: 0,
      cap: 5.00
    },
    stablecoin: {
      stripe: { percent: 1.5, fixed: 0 }, // Stripe's 1.5% rate
      other: { percent: 0.9, fixed: 0 }, // Other gateways <1%
      networkFees: {
        efficient: 0.05, // $0.05 per transaction (Tron, Solana)
        standard: 0.10  // $0.10 per transaction (Ethereum)
      },
      conversionRate: 0.5 // 0.5% for fiat conversion
    },
    instantPayout: {
      percent: 1.5,
      minimum: 0.50
    },
    dispute: {
      fee: 15.00
    },
    radar: {
      perTransaction: 0.05,
      fraudTeams: 0.07
    }
  };

  // Ensure volumes add up to 100%
  const handleVolumeChange = (method, value) => {
    const newValue = Math.max(0, Math.min(100, Number(value)));
    const otherMethods = Object.keys(paymentVolumes).filter(k => k !== method);
    const currentOthersTotal = otherMethods.reduce((sum, k) => sum + paymentVolumes[k], 0);
    
    if (currentOthersTotal + newValue > 100) {
      const scale = (100 - newValue) / currentOthersTotal;
      const newVolumes = { [method]: newValue };
      otherMethods.forEach(k => {
        newVolumes[k] = paymentVolumes[k] * scale;
      });
      setPaymentVolumes(newVolumes);
    } else {
      setPaymentVolumes({ ...paymentVolumes, [method]: newValue });
    }
  };

  // Calculate fees
  const calculateFees = () => {
    const numTransactions = monthlyVolume / avgTransaction;
    let totalFees = 0;
    let breakdown = {};
    let totalSavings = 0;

    // Calculate volume for each payment method
    const volumes = {
      domesticCards: monthlyVolume * (paymentVolumes.domesticCards / 100),
      internationalCards: monthlyVolume * (paymentVolumes.internationalCards / 100),
      ach: monthlyVolume * (paymentVolumes.ach / 100),
      stablecoins: monthlyVolume * (paymentVolumes.stablecoins / 100)
    };

    // Domestic cards
    if (volumes.domesticCards > 0) {
      const domesticTxns = volumes.domesticCards / avgTransaction;
      const domesticFees = (volumes.domesticCards * rates.card.domestic.percent) / 100 + 
                          (domesticTxns * rates.card.domestic.fixed);
      breakdown.domesticCards = domesticFees;
      totalFees += domesticFees;
    }

    // International cards
    if (volumes.internationalCards > 0) {
      const intlTxns = volumes.internationalCards / avgTransaction;
      const intlFees = (volumes.internationalCards * rates.card.international.percent) / 100 + 
                      (intlTxns * rates.card.international.fixed);
      const currencyFees = volumes.internationalCards * 0.2 * rates.card.currencyConversion / 100;
      
      breakdown.internationalCards = intlFees;
      breakdown.currencyConversion = currencyFees;
      totalFees += intlFees + currencyFees;
    }

    // ACH processing
    if (volumes.ach > 0) {
      const achTxns = volumes.ach / avgTransaction;
      const achFeePerTransaction = Math.min(avgTransaction * rates.ach.percent / 100, rates.ach.cap);
      breakdown.achProcessing = achTxns * achFeePerTransaction;
      totalFees += breakdown.achProcessing;
    }

    // Stablecoin processing
    if (volumes.stablecoins > 0) {
      const stablecoinTxns = volumes.stablecoins / avgTransaction;
      
      // Gateway fees
      const gatewayRate = stablecoinGateway === 'stripe' ? rates.stablecoin.stripe : rates.stablecoin.other;
      const gatewayFees = (volumes.stablecoins * gatewayRate.percent) / 100;
      
      // Network fees
      const networkFees = stablecoinTxns * rates.stablecoin.networkFees[stablecoinNetwork];
      
      // Conversion fees if needed
      const conversionFees = requiresConversion ? 
        (volumes.stablecoins * rates.stablecoin.conversionRate) / 100 : 0;
      
      breakdown.stablecoinGateway = gatewayFees;
      breakdown.stablecoinNetwork = networkFees;
      if (requiresConversion) {
        breakdown.stablecoinConversion = conversionFees;
      }
      
      totalFees += gatewayFees + networkFees + conversionFees;
      
      // Calculate savings vs traditional cards
      const equivalentCardFees = (volumes.stablecoins * rates.card.domestic.percent) / 100 + 
                                (stablecoinTxns * rates.card.domestic.fixed);
      const stablecoinTotalFees = gatewayFees + networkFees + conversionFees;
      totalSavings += Math.max(0, equivalentCardFees - stablecoinTotalFees);
    }

    // Radar fees (only for card transactions)
    if (radarEnabled) {
      const cardTxns = (volumes.domesticCards + volumes.internationalCards) / avgTransaction;
      breakdown.fraudProtection = cardTxns * rates.radar.perTransaction;
      totalFees += breakdown.fraudProtection;
    }

    // Dispute fees (mainly for cards)
    const cardVolume = volumes.domesticCards + volumes.internationalCards;
    const cardTxns = cardVolume / avgTransaction;
    const disputeCount = cardTxns * (disputeRate / 100);
    breakdown.disputes = disputeCount * rates.dispute.fee;
    totalFees += breakdown.disputes;

    // Instant payout fees
    if (instantPayouts) {
      const payoutFee = Math.max(monthlyVolume * rates.instantPayout.percent / 100, 
                                rates.instantPayout.minimum * 30);
      breakdown.instantPayouts = payoutFee;
      totalFees += payoutFee;
    }

    return {
      totalFees: totalFees.toFixed(2),
      effectiveRate: ((totalFees / monthlyVolume) * 100).toFixed(3),
      numTransactions: Math.round(numTransactions),
      breakdown: breakdown,
      netRevenue: (monthlyVolume - totalFees).toFixed(2),
      stablecoinSavings: totalSavings.toFixed(2),
      volumes: volumes
    };
  };

  const results = calculateFees();
  const totalVolumePercentage = Object.values(paymentVolumes).reduce((sum, v) => sum + v, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            💳 Stripe Fee Calculator for all payment methods
          </h1>
          <p className="text-gray-600 mt-2">
            Compare traditional payments with stablecoin processing fees.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              </div>
            </div>

            {/* Payment Method Mix */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Method Mix</h2>
              <p className="text-sm text-gray-600 mb-4">
                Adjust the percentage of volume for each payment method. Total: {totalVolumePercentage.toFixed(1)}%
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      Domestic Cards
                    </label>
                    <span className="text-sm text-gray-500">2.9% + $0.30</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={paymentVolumes.domesticCards}
                    onChange={(e) => handleVolumeChange('domesticCards', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{paymentVolumes.domesticCards.toFixed(1)}%</span>
                    <span>${(results.volumes.domesticCards).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      International Cards
                    </label>
                    <span className="text-sm text-gray-500">3.4% + $0.30</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={paymentVolumes.internationalCards}
                    onChange={(e) => handleVolumeChange('internationalCards', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{paymentVolumes.internationalCards.toFixed(1)}%</span>
                    <span>${(results.volumes.internationalCards).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      ACH Direct Debit
                    </label>
                    <span className="text-sm text-gray-500">0.8% (max $5)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={paymentVolumes.ach}
                    onChange={(e) => handleVolumeChange('ach', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{paymentVolumes.ach.toFixed(1)}%</span>
                    <span>${(results.volumes.ach).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-green-700">
                      💰 Stablecoins (USDC, USDT)
                    </label>
                    <span className="text-sm text-green-600">~1.5% + network fees</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={paymentVolumes.stablecoins}
                    onChange={(e) => handleVolumeChange('stablecoins', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{paymentVolumes.stablecoins.toFixed(1)}%</span>
                    <span>${(results.volumes.stablecoins).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stablecoin Options */}
            {paymentVolumes.stablecoins > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6 text-green-900">Stablecoin Configuration</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Gateway
                    </label>
                    <select
                      value={stablecoinGateway}
                      onChange={(e) => setStablecoinGateway(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="stripe">Stripe (1.5%)</option>
                      <option value="other">Other Gateway (~0.9%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blockchain Network
                    </label>
                    <select
                      value={stablecoinNetwork}
                      onChange={(e) => setStablecoinNetwork(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="efficient">Tron/Solana (~$0.05/tx)</option>
                      <option value="standard">Ethereum (~$0.10/tx)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Fiat Conversion Required</label>
                      <p className="text-sm text-gray-500">Add 0.5% if converting to/from USD</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresConversion}
                      onChange={(e) => setRequiresConversion(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Additional Features</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Radar Fraud Protection</label>
                    <p className="text-sm text-gray-500">+$0.05 per card transaction</p>
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
                  <p className="text-sm text-gray-500 mt-1">$15 per dispute (cards only)</p>
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

                {Number(results.stablecoinSavings) > 0 && (
                  <div className="pt-4 border-t border-blue-500">
                    <div className="text-xl font-bold text-green-300">
                      +${results.stablecoinSavings}
                    </div>
                    <div className="text-blue-100">Saved with Stablecoins</div>
                  </div>
                )}
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

            {/* Stablecoin Benefits */}
                  {paymentVolumes.stablecoins > 5 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🚀</span>
                        <div>
                          <h4 className="font-semibold text-green-900">Stablecoin Benefits</h4>
                          <ul className="text-sm text-green-700 mt-2 space-y-1">
                            <li>• Lower processing fees vs cards</li>
                            <li>• Near-instant settlement</li>
                            <li>• No chargebacks</li>
                            <li>• Global reach without FX fees</li>
                          </ul>
                          {Number(results.stablecoinSavings) > 0 && (
                            <div className="mt-3 pt-3 border-t border-green-300">
                              <p className="font-semibold text-green-900">
                                Total Monthly Savings: ${formatNumber(Number(results.stablecoinSavings))}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Compared to processing same volume with cards
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

            {/* Share on Twitter */}
            {monthlyVolume > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🐦</span>
                  <div className="w-full">
                    <h4 className="font-semibold text-blue-900">Share Your Results</h4>
                    <p className="text-sm text-blue-700 mt-1 mb-3">
                      Found these calculations helpful? Share with others!
                    </p>
                    <a
                      href={`https://twitter.com/intent/tweet?text=Just calculated my Stripe fees on ${monthlyVolume > 1000000 ? '$' + (monthlyVolume/1000000).toFixed(1) + 'M' : '$' + (monthlyVolume/1000).toFixed(0) + 'K'} monthly volume. ${Number(results.stablecoinSavings) > 0 ? 'Potential savings with stablecoins: $' + formatNumber(Number(results.stablecoinSavings)) + '/month! 💰' : 'Effective rate: ' + results.effectiveRate + '%'}%0A%0ACheck out this calculator: ${window.location.href}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Share on Twitter
                    </a>
                    <p className="text-xs text-gray-500 mt-3">
                      Coming soon: More features and integrations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Rate</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-gray-200">
                      {Object.entries(results.volumes).map(([method, volume]) => {
                        if (volume === 0) return null;
                        const txns = Math.round(volume / avgTransaction);
                        const methodFees = Object.entries(results.breakdown)
                          .filter(([key]) => key.toLowerCase().includes(method.toLowerCase().replace('Cards', '')))
                          .reduce((sum, [, value]) => sum + value, 0);
                        
                        // Format method name with capital first letter
                        const formattedMethod = method
                          .replace(/([A-Z])/g, ' $1')
                          .trim()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ');
                        
                        return (
                          <tr key={method}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formattedMethod}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              ${formatNumber(volume)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatNumber(txns)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              ${formatNumber(methodFees)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {volume > 0 ? ((methodFees / volume) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;