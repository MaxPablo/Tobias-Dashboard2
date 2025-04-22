import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Euro, Calendar, PiggyBank } from 'lucide-react';

function App() {
  const [investment, setInvestment] = useState(5000);
  const [weeks, setWeeks] = useState(0);
  const [nextUpdate, setNextUpdate] = useState<string>('');
  const [progressToNextUpdate, setProgressToNextUpdate] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [currentGrowthRate, setCurrentGrowthRate] = useState(0.0256); // Initial growth rate
  
  // Constants moved outside component to prevent recreating on each render
  const START_DATE = useMemo(() => {
    const date = new Date('2025-03-21T09:00:00');
    return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  }, []);
  
  const END_DATE = useMemo(() => {
    const date = new Date('2025-12-31T23:59:59');
    return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  }, []);
  
  const INITIAL_INVESTMENT = 5000; // Updated with 2% increase from 5000
  const CHECK_INTERVAL = 1000 * 30; // Check every 30 seconds for more precise timing

  // Force first update
  useEffect(() => {
    if (weeks === 0) {
      setWeeks(1);
      setInvestment(5320.54); // Updated with 2% increase from 5128.02
      
      // Set new random growth rate for next week
      const newRate = (Math.random() * (2.2 - 0.5) + 0.5) / 100;
      setCurrentGrowthRate(newRate);
    }
  }, [weeks]);

  // Memoized formatter to prevent recreation on each render
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  }), []);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), []);

  const calculateNextFriday = useCallback((date: Date) => {
    // Convert to German time
    const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    const nextFriday = new Date(berlinTime);
    nextFriday.setDate(berlinTime.getDate() + ((7 - berlinTime.getDay() + 5) % 7 || 7));
    nextFriday.setHours(9, 0, 0, 0);
    return nextFriday;
  }, []);

  const shouldUpdate = useCallback((now: Date) => {
    // Convert current time to German time
    const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    
    // Check if it's exactly Friday at 9:00:00 AM German time
    const isFriday = berlinTime.getDay() === 5;
    const isNineAM = berlinTime.getHours() === 9 && berlinTime.getMinutes() === 0;
    const isWithinTimeframe = berlinTime >= START_DATE && berlinTime <= END_DATE;
    
    // Create a key for this specific update time
    const updateKey = berlinTime.toISOString().split('T')[0]; // Use date part only
    
    // Check if we haven't updated yet today
    const needsUpdate = lastUpdateTime !== updateKey;
    
    if (isFriday && isNineAM && isWithinTimeframe && needsUpdate) {
      setLastUpdateTime(updateKey);
      return true;
    }
    
    return false;
  }, [START_DATE, END_DATE, lastUpdateTime]);

  const checkAndUpdate = useCallback(() => {
    try {
      const now = new Date();
      
      // Before start date logic
      if (now < START_DATE) {
        setNextUpdate(dateFormatter.format(START_DATE));
        setProgressToNextUpdate(0);
        return;
      }

      // After end date logic
      if (now > END_DATE) {
        setProgressToNextUpdate(100);
        return;
      }

      // Set next update date
      const nextFriday = calculateNextFriday(now);
      setNextUpdate(dateFormatter.format(nextFriday));

      // Calculate progress
      const totalDuration = END_DATE.getTime() - START_DATE.getTime();
      const currentProgress = Math.min(now.getTime() - START_DATE.getTime(), totalDuration);
      const progress = Math.min(100, Math.max(0, (currentProgress / totalDuration) * 100));
      setProgressToNextUpdate(progress);

      // Check if we should update the investment
      if (shouldUpdate(now)) {
        const weeksSinceStart = Math.floor((now.getTime() - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksSinceStart > weeks) {
          setWeeks(weeksSinceStart);
          setInvestment(prev => Number((prev * (1 + currentGrowthRate)).toFixed(2)));
          
          // Set new random growth rate for next week
          const newRate = (Math.random() * (2.2 - 0.5) + 0.5) / 100;
          setCurrentGrowthRate(newRate);
        }
      }
    } catch (error) {
      console.error('Error updating investment data:', error);
    }
  }, [weeks, START_DATE, END_DATE, dateFormatter, calculateNextFriday, shouldUpdate, currentGrowthRate]);

  useEffect(() => {
    checkAndUpdate();
    const timer = setInterval(checkAndUpdate, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [checkAndUpdate]);

  const formatCurrency = useCallback((amount: number) => {
    return currencyFormatter.format(amount);
  }, [currencyFormatter]);

  const calculateProfit = useCallback(() => {
    return Number((investment - INITIAL_INVESTMENT).toFixed(2));
  }, [investment]);

  const calculateGrowthPercentage = useCallback(() => {
    return ((investment - INITIAL_INVESTMENT) / INITIAL_INVESTMENT * 100).toFixed(1);
  }, [investment]);

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
            <PiggyBank className="w-8 h-8 text-blue-600 mr-2" />
            Investment Dashboard für Tobias
          </h1>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 flex items-center">
                  <Euro className="w-5 h-5 mr-2 text-blue-600" />
                  Aktuelles Kapital
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(investment)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                +{calculateGrowthPercentage()}% Gesamtwachstum
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Gewinn seit Start
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateProfit())}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Nächste Wachstumsrate: +{formatPercentage(currentGrowthRate)}
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Investitionszeitraum
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {weeks} {weeks === 1 ? 'Woche' : 'Wochen'}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h2 className="text-sm text-gray-600 mb-2">Investment Details</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex justify-between">
                <span>Startkapital:</span>
                <span className="font-medium">{formatCurrency(INITIAL_INVESTMENT)}</span>
              </li>
              <li className="flex justify-between">
                <span>Hinzugefügtes Kapital:</span>
                <span className="font-medium text-green-600">{formatCurrency(calculateProfit())}</span>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span>Nächstes Update:</span>
                  <span className="font-medium">{nextUpdate}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNextUpdate}%` }}
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;