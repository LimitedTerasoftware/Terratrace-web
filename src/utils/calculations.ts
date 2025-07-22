import { MachineData, PerformanceMetrics } from '../types/machine';

export const calculatePerformanceMetrics = (data: MachineData): PerformanceMetrics => {
  const distance = data.monthlyTotalDistance;
  
  if (distance >= 10) {
    return {
      status: 'excellent',
      message: `Excellent Performance! ${distance} km - Earning incentives`,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200'
    };
  } else if (distance >= 7.5) {
    return {
      status: 'good',
      message: `Good Performance! ${distance} km - Earning incentives`,
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200'
    };
  } else if (distance >= 5) {
    return {
      status: 'warning',
      message: `Below Target: ${distance} km - Penalty applied`,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200'
    };
  } else {
    return {
      status: 'penalty',
      message: `Critical: ${distance} km - High penalty applied`,
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200'
    };
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(2)} km`;
};

export const getPerformanceStatus = (efficiency: number): { status: string; color: string } => {
  if (efficiency >= 100) return { status: 'Excellent', color: '#10B981' };
  if (efficiency >= 90) return { status: 'Good', color: '#F59E0B' };
  if (efficiency >= 70) return { status: 'Average', color: '#EF4444' };
  return { status: 'Poor', color: '#DC2626' };
};

export const calculatePenaltyBreakdown = (distance: number) => {
  if (distance >= 7.5) return null;
  
  const shortfall = 7.5 - distance;
  const segments = Math.ceil(shortfall / 0.25); // 250m segments
  
  if (distance >= 5) {
    return {
      shortfall: shortfall.toFixed(2),
      segments,
      ratePerSegment: 40000,
      totalPenalty: segments * 40000
    };
  } else {
    return {
      shortfall: shortfall.toFixed(2),
      segments,
      ratePerSegment: 42000,
      totalPenalty: segments * 42000
    };
  }
};

export const calculateIncentiveBreakdown = (distance: number) => {
  if (distance <= 7.5) return null;
  
  const excess = distance - 7.5;
  const segments = Math.floor(excess / 0.25); // 250m segments
  
  if (distance <= 10) {
    return {
      excess: excess.toFixed(2),
      segments,
      ratePerSegment: 42000,
      totalIncentive: segments * 42000
    };
  } else {
    const firstTierSegments = Math.floor(2.5 / 0.25); // 7.5-10 km
    const secondTierSegments = Math.floor((distance - 10) / 0.25); // >10 km
    
    return {
      excess: excess.toFixed(2),
      segments: firstTierSegments + secondTierSegments,
      ratePerSegment: 'Mixed (42k + 45k)',
      totalIncentive: firstTierSegments * 42000 + secondTierSegments * 45000
    };
  }
};