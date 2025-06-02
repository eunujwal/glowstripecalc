// src/components/StripePricingCalculator.js
import React, { useState, useEffect } from 'react';
import { ChevronDown, Calculator, CreditCard, Globe, Zap, TrendingUp, DollarSign, Info } from 'lucide-react';

// Animation wrapper component
const AnimatedSection = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      {children}
    </div>
  );
};

// Tooltip component
const Tooltip = ({ content }) => (
  <div className="group relative inline-block">
    <Info className="w-4 h-4 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// Input field component
const InputField = ({ label, value, onChange, type = "number", prefix = "", suffix = "", tooltip = "", placeholder = "" }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
      {label}
      {tooltip && <Tooltip content={tooltip} />}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">{suffix}</span>
      )}
    </div>
  </div>
);

// Select field component
const SelectField = ({ label, value, onChange, options, tooltip = "" }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
      {label}
      {tooltip && <Tooltip content={tooltip} />}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// Toggle switch component
const ToggleSwitch = ({ label, enabled, onChange, tooltip = "" }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// Main calculator component
const StripePricingCalculator = () => {
  // State management
  const [monthlyVolume, setMonthlyVolume] = useState('100000');
  const [avgTransactionSize, setAvgTransactionSize] = useState('50');
  const [cardType, setCardType] = useState('domestic');
  const [businessType, setBusinessType] = useState('standard');
  const [includeTerminal, setIncludeTerminal] = useState(false);
  const [includeACH, setIncludeACH] = useState(false);
  const [includeBilling, setIncludeBilling] = useState(false);
  const [includeConnect, setIncludeConnect] = useState(false);
  const [includeRadar, setIncludeRadar] = useState(true);

  // Pricing rates
  const rates = {
    domestic: { percentage: 2.9, fixed: 0.30 },
    international: { percentage: 3.4, fixed: 0.30 },
    terminal: { percentage: 2.7, fixed: 0.05 },
    ach: { percentage: 0.8, fixed: 0, cap: 5 },
    billing: { percentage: 0.5, fixed: 0 },
    connect: { percentage: 0.25, fixed: 2 },
    radar: { perTransaction: 0.05 }
  };

  // Calculate fees
  const calculateFees = () => {
    const volume = parseFloat(monthlyVolume) || 0;
    const avgSize = parseFloat(avgTransactionSize) || 0;
    const transactions = avgSize > 0 ? volume / avgSize : 0;
    
    let totalFees = 0;
    let breakdown = {};
    
    // Card processing fees
    const cardRate = rates[cardType];
    const cardFees = (volume * cardRate.percentage / 100) + (transactions * cardRate.fixed);
    totalFees += cardFees;
    breakdown.cardProcessing = cardFees;
    
    // Terminal fees
    if (includeTerminal) {
      const terminalVolume = volume * 0.3; // Assume 30% of volume is in-person
      const terminalTransactions = terminalVolume / avgSize;
      const terminalFees = (terminalVolume * rates.terminal.percentage / 100) + (terminalTransactions * rates.terminal.fixed);
      totalFees += terminalFees;
      breakdown.terminal = terminalFees;
    }
    
    // ACH fees
    if (includeACH) {
      const achVolume = volume * 0.2; // Assume 20% of volume is ACH
      const achTransactions = achVolume / avgSize;
      const achFees = achTransactions * Math.min((avgSize * rates.ach.percentage / 100), rates.ach.cap);
      totalFees += achFees;
      breakdown.ach = achFees;
    }
    
    // Billing fees
    if (includeBilling) {
      const billingFees = volume * rates.billing.percentage / 100;
      totalFees += billingFees;
      breakdown.billing = billingFees;
    }
    
    // Connect fees
    if (includeConnect) {
      const connectFees = (volume * rates.connect.percentage / 100) + (100 * rates.connect.fixed); // Assume 100 active accounts
      totalFees += connectFees;
      breakdown.connect = connectFees;
    }
    
    // Radar fees
    if (includeRadar) {
      const radarFees = transactions * rates.radar.perTransaction;
      totalFees += radarFees;
      breakdown.radar = radarFees;
    }

    // Identify savings opportunities
    const savingsOpportunities = [];
    if (volume > 500000) {
      savingsOpportunities.push({
        type: 'volume',
        message: 'Eligible for enterprise pricing - potential 15-25% savings',
        icon: '💰'
      });
    }
    if (!includeACH && avgSize > 100) {
      savingsOpportunities.push({
        type: 'payment_method',
        message: 'Consider ACH for large transactions - save up to 2.1%',
        icon: '🏦'
      });
    }
    if (cardType === 'international') {
      savingsOpportunities.push({
        type: 'international',
        message: 'Use local payment methods to reduce international fees',
        icon: '🌍'
      });
    }
    
    return {
      totalFees,
      breakdown,
      effectiveRate: volume > 0 ? (totalFees / volume * 100) : 0,
      transactions,
      savingsOpportunities
    };
  };

  const results = calculateFees();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <AnimatedSection>
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Stripe Pricing Calculator</h1>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <AnimatedSection delay={100}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Business Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Monthly Processing Volume"
                    value={monthlyVolume}
                    onChange={setMonthlyVolume}
                    prefix="$"
                    tooltip="Total amount you expect to process monthly"
                    placeholder="100000"
                  />
                  
                  <InputField
                    label="Average Transaction Size"
                    value={avgTransactionSize}
                    onChange={setAvgTransactionSize}
                    prefix="$"
                    tooltip="Average amount per transaction"
                    placeholder="50"
                  />
                  
                  <SelectField
                    label="Primary Card Type"
                    value={cardType}
                    onChange={setCardType}
                    options={[
                      { value: 'domestic', label: 'Domestic Cards (2.9% + 30¢)' },
                      { value: 'international', label: 'International Cards (3.4% + 30¢)' }
                    ]}
                    tooltip="Most common card type for your business"
                  />
                  
                  <SelectField
                    label="Business Type"
                    value={businessType}
                    onChange={setBusinessType}
                    options={[
                      { value: 'standard', label: 'Standard Business' },
                      { value: 'platform', label: 'Platform/Marketplace' },
                      { value: 'subscription', label: 'Subscription-based' }
                    ]}
                  />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Additional Features
                </h2>
                
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Terminal (In-Person Payments)"
                    enabled={includeTerminal}
                    onChange={setIncludeTerminal}
                    tooltip="2.7% + 5¢ per transaction"
                  />
                  
                  <ToggleSwitch
                    label="ACH Direct Debit"
                    enabled={includeACH}
                    onChange={setIncludeACH}
                    tooltip="0.8% capped at $5 per transaction"
                  />
                  
                  <ToggleSwitch
                    label="Billing & Subscriptions"
                    enabled={includeBilling}
                    onChange={setIncludeBilling}
                    tooltip="0.5% of billing volume"
                  />
                  
                  <ToggleSwitch
                    label="Connect (Platform Fees)"
                    enabled={includeConnect}
                    onChange={setIncludeConnect}
                    tooltip="0.25% + $2 per active account"
                  />
                  
                  <ToggleSwitch
                    label="Radar (Fraud Protection)"
                    enabled={includeRadar}
                    onChange={setIncludeRadar}
                    tooltip="5¢ per screened transaction"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            <AnimatedSection delay={300}>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white sticky top-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Cost Estimate
                </h2>
                
                <div className="space-y-6">
                  <div className="text-center py-6 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-4xl font-bold mb-2">
                      ${results.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm opacity-90">Total Monthly Fees</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-sm">Effective Rate</span>
                      <span className="font-semibold">{results.effectiveRate.toFixed(2)}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-sm">Monthly Transactions</span>
                      <span className="font-semibold">{Math.round(results.transactions).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <h3 className="text-sm font-semibold mb-3 opacity-90">Fee Breakdown</h3>
                    
                    {Object.entries(results.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="capitalize opacity-80">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {results.savingsOpportunities.length > 0 && (
              <AnimatedSection delay={400}>
                <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Potential Savings
                  </h3>
                  
                  <div className="space-y-3">
                    {results.savingsOpportunities.map((opp, index) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <span className="mr-2">{opp.icon}</span>
                          {opp.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Calculations based on publicly available Stripe pricing. Actual fees may vary.</p>
          <p className="mt-2">Not affiliated with Stripe, Inc.</p>
        </div>
      </div>
    </div>
  );
};

export default StripePricingCalculator;