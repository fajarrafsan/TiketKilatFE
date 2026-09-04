'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';
import {
  catalogApiPath,
  emptyFlightSearch,
  mergeSearchOptions,
  readFlightSearch,
} from '@/lib/flight-catalog';
import {
  flightAirlines,
  flightCities,
  flightSearchHref,
  type HomeSearchValues,
} from '@/lib/flight-search';
import type { Flight } from '@/lib/types';

export function useFlightCatalog() {
  const [filters, setFilters] = useState<HomeSearchValues>({
    ...emptyFlightSearch,
  });
  const [applied, setApplied] = useState<HomeSearchValues>({
    ...emptyFlightSearch,
  });
  const [cities, setCities] = useState(flightCities);
  const [airlines, setAirlines] = useState(flightAirlines);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const invalidateRequests = useCallback(() => {
    requestId.current++;
  }, []);

  const search = useCallback(async (next: HomeSearchValues) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    setApplied({ ...next });
    setFlights([]);
    try {
      const data = await apiGet<Flight[]>(catalogApiPath(next));
      if (id !== requestId.current) return;
      setFlights(data ?? []);
      window.history.replaceState(null, '', flightSearchHref(next));
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(
        caught instanceof Error
          ? caught.message
          : 'Penerbangan belum dapat dimuat. Coba lagi.',
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const initial = readFlightSearch(window.location.search);
      setFilters(initial);
      void search(initial);
      void apiGet<string[]>('/user/daftar-kota')
        .then((data) => {
          if (active) setCities(mergeSearchOptions(flightCities, data ?? []));
        })
        .catch(() => {
          /* Static and query-selected cities remain usable. */
        });
      void apiGet<string[]>('/user/daftar-maskapai')
        .then((data) => {
          if (active)
            setAirlines(mergeSearchOptions(flightAirlines, data ?? []));
        })
        .catch(() => {
          /* Keep the existing airline options on metadata failure. */
        });
    });
    return () => {
      active = false;
      invalidateRequests();
    };
  }, [search, invalidateRequests]);

  return {
    filters,
    setFilters,
    applied,
    flights,
    loading,
    error,
    search,
    cities: mergeSearchOptions(cities, [filters.from, filters.to]),
    airlines: mergeSearchOptions(airlines, [filters.airline]),
  };
}
