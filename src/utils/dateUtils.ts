import { format, parseISO, isValid } from 'date-fns';

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

export const getLastWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return format(date, 'yyyy-MM-dd');
};