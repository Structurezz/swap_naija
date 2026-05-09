import { create } from 'zustand';

export const useListingsStore = create((set) => ({
  filters: {
    q: '',
    categoryId: '',
    locationState: '',
    locationLga: '',
    listingType: '',
    condition: '',
    sort: 'newest',
    page: 1,
    limit: 20,
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters, page: 1 },
    })),

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  resetFilters: () =>
    set({
      filters: {
        q: '',
        categoryId: '',
        locationState: '',
        locationLga: '',
        listingType: '',
        condition: '',
        sort: 'newest',
        page: 1,
        limit: 20,
      },
    }),
}));
