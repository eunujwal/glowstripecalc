// src/hooks/useSupabaseCalculator.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, saveCalculation, getSessionCalculations, trackEvent } from '../lib/supabaseClient';

export const useSupabaseCalculator = (sessionId) => {
  const [calculations, setCalculations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load calculations for session
  useEffect(() => {
    if (sessionId) {
      loadCalculations();
    }
  }, [sessionId]);

  const loadCalculations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSessionCalculations(sessionId);
      setCalculations(data || []);
    } catch (err) {
      console.error('Error loading calculations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalculationData = useCallback(async (inputData, results) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const calculationData = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        
        // Inputs
        monthly_volume: parseFloat(inputData.monthlyVolume) || 0,
        avg_transaction_size: parseFloat(inputData.avgTransactionSize) || 0,
        card_type: inputData.cardType || 'domestic',
        business_type: inputData.businessType || 'standard',
        features: inputData.features || {},
        
        // Results
        total_fees: results.totalFees || 0,
        effective_rate: results.effectiveRate || 0,
        monthly_transactions: Math.round(results.transactions) || 0,
        breakdown: results.breakdown || {},
        savings_opportunities: results.savingsOpportunities || [],
        
        // Metadata
        user_agent: navigator.userAgent,
        ip_address: null // Will be set server-side if needed
      };

      const savedData = await saveCalculation(calculationData);
      
      // Update local state
      setCalculations(prev => [savedData, ...prev]);
      
      // Track event
      await trackEvent('calculation_completed', {
        session_id: sessionId,
        monthly_volume: calculationData.monthly_volume,
        effective_rate: calculationData.effective_rate,
        features_enabled: Object.keys(calculationData.features).filter(k => calculationData.features[k])
      });
      
      return savedData;
    } catch (err) {
      console.error('Error saving calculation:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [sessionId]);

  const trackFeatureToggle = useCallback(async (feature, enabled) => {
    await trackEvent('feature_toggle', {
      session_id: sessionId,
      feature,
      enabled,
      timestamp: new Date().toISOString()
    });
  }, [sessionId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    calculations,
    saveCalculationData,
    loadCalculations,
    trackFeatureToggle,
    isLoading,
    isSaving,
    error,
    clearError
  };
};