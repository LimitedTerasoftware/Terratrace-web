import { useMemo } from 'react';
import { Placemark, FilterState } from '../types/kmz';

export const useFiltering = (placemarks: Placemark[], filters: FilterState, searchQuery: string) => {
  return useMemo(() => {
    let filtered = placemarks;

    // Apply location filters
    if (filters.state) {
      filtered = filtered.filter(p => p.state === filters.state);
    }
    if (filters.division) {
      filtered = filtered.filter(p => p.division === filters.division);
    }
    if (filters.block) {
      filtered = filtered.filter(p => p.block === filters.block);
    }
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query) ||
        p.division?.toLowerCase().includes(query) ||
        p.block?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [placemarks, filters, searchQuery]);
};