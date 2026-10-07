'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'USD' | 'ETB';

interface CurrencyContextType {
  currency: Currency;
  rate: number;
  isLoaded: boolean;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  convertUsdToEtb: (usdPrice: number) => number;
  convertEtbToUsd: (etbPrice: number) => number;
  formatPrice: (usdPrice: number) => {
    primary: string;
    secondary: string;
    amount: number;
    currency: Currency;
  };
  refreshRate: () => Promise<number>;
  updateUniversalRate: (newRate: number, syncRooms?: boolean) => Promise<{ success: boolean; rate: number; message?: string }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [rate, setRateState] = useState<number>(189); // Default fallback rate
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/exchange-rate?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && typeof data.rate === 'number' && data.rate > 0) {
        setRateState(data.rate);
        localStorage.setItem('gah_usd_to_etb_rate', data.rate.toString());
        return data.rate;
      }
    } catch (e) {
      console.warn('Could not fetch exchange rate, using cached or default', e);
    }
    return 189;
  }, []);

  useEffect(() => {
    // 1. Load cached currency preference
    const savedCurrency = localStorage.getItem('gah_currency');
    if (savedCurrency === 'ETB' || savedCurrency === 'USD') {
      setCurrencyState(savedCurrency);
    }

    // 2. Load cached exchange rate for instant render
    const savedRate = localStorage.getItem('gah_usd_to_etb_rate');
    if (savedRate) {
      const parsed = parseFloat(savedRate);
      if (!isNaN(parsed) && parsed > 0) {
        setRateState(parsed);
      }
    }

    // 3. Fetch latest live exchange rate from PostgreSQL database
    fetchRate().then(() => setIsLoaded(true));

    // 4. Polling every 20 seconds so visitors always receive admin rate updates automatically
    const pollTimer = setInterval(() => {
      fetchRate();
    }, 20000);

    // 5. Instantly refresh when the browser window or tab becomes active
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRate();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 6. Listen for in-app or cross-tab custom update events
    const handleRateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ rate: number }>;
      if (customEvent.detail?.rate) {
        setRateState(customEvent.detail.rate);
      } else {
        fetchRate();
      }
    };

    // 7. Cross-tab storage synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gah_usd_to_etb_rate' && e.newValue) {
        const parsed = parseFloat(e.newValue);
        if (!isNaN(parsed) && parsed > 0) {
          setRateState(parsed);
        }
      }
      if (e.key === 'gah_currency' && (e.newValue === 'USD' || e.newValue === 'ETB')) {
        setCurrencyState(e.newValue as Currency);
      }
    };

    window.addEventListener('gah_exchange_rate_updated', handleRateChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('gah_exchange_rate_updated', handleRateChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchRate]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('gah_currency', c);
  };

  const toggleCurrency = () => {
    const next = currency === 'USD' ? 'ETB' : 'USD';
    setCurrency(next);
  };

  const convertUsdToEtb = (usdPrice: number): number => {
    return Math.round(usdPrice * rate);
  };

  const convertEtbToUsd = (etbPrice: number): number => {
    return rate > 0 ? Math.round((etbPrice / rate) * 100) / 100 : 0;
  };

  const formatPrice = (usdPrice: number): {
    primary: string;
    secondary: string;
    amount: number;
    currency: Currency;
  } => {
    const etbPrice = Math.round(usdPrice * rate);
    if (currency === 'ETB') {
      return {
        primary: `${etbPrice.toLocaleString()} ETB`,
        secondary: `$${usdPrice.toLocaleString()} USD`,
        amount: etbPrice,
        currency: 'ETB',
      };
    } else {
      return {
        primary: `$${usdPrice.toLocaleString()}`,
        secondary: `${etbPrice.toLocaleString()} ETB`,
        amount: usdPrice,
        currency: 'USD',
      };
    }
  };

  const refreshRate = async (): Promise<number> => {
    return await fetchRate();
  };

  const updateUniversalRate = async (newRate: number, syncRooms = false) => {
    try {
      const res = await fetch('/api/admin/settings/exchange-rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: newRate, syncRooms }),
      });
      const data = await res.json();
      if (data.success) {
        setRateState(newRate);
        localStorage.setItem('gah_usd_to_etb_rate', newRate.toString());
        // Dispatch broadcast so other components re-render immediately
        window.dispatchEvent(new CustomEvent('gah_exchange_rate_updated', { detail: { rate: newRate } }));
        return { success: true, rate: newRate, message: data.message };
      }
      return { success: false, rate, message: data.error || 'Failed to update rate' };
    } catch (err: any) {
      return { success: false, rate, message: err.message || 'Network error' };
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rate,
        isLoaded,
        setCurrency,
        toggleCurrency,
        convertUsdToEtb,
        convertEtbToUsd,
        formatPrice,
        refreshRate,
        updateUniversalRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
