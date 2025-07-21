import { format, parseISO, isValid, startOfWeek, subWeeks, endOfWeek } from 'date-fns';

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM dd') : dateString;
  } catch {
    return dateString;
  }
};

export const parseDistance = (distanceString: string): number => {
  const numericValue = parseFloat(distanceString.replace(' km', ''));
  return isNaN(numericValue) ? 0 : numericValue;
};

export const getTodayDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};
export const getTodayMon = (): string => {
  return format(new Date(), 'mm');
};
export const getTodayYear = (): string => {
  return format(new Date(), 'yyyy');
};
export const getLastWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return format(date, 'yyyy-MM-dd');
};

export const getThisWeekFromDate = (): string => {
  const date = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday as start
  return format(date, 'yyyy-MM-dd');
};

export const getLastWeekFromDate = (): string => {
  const date = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  return format(date, 'yyyy-MM-dd');
};

export const getLastWeekToDate = (): string => {
  const date = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  return format(date, 'yyyy-MM-dd');
};

// This Month - From (start of month) to Today
export const getThisMonthFromDate = (): string => {
  const date = new Date();
  date.setDate(1); // First day of current month
  return format(date, 'yyyy-MM-dd');
};

export const getThisMonthToDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd'); // Today's date
};

// Last Month - From (start of last month) to (end of last month)
export const getLastMonthFromDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(1); // First day of last month
  return format(date, 'yyyy-MM-dd');
};

export const getLastMonthToDate = (): string => {
  const date = new Date();
  date.setDate(0); // Last day of previous month
  return format(date, 'yyyy-MM-dd');
};