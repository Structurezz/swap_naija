import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useListingsStore } from '../store/listings.store';
import * as listingsApi from '../api/listings.api';

export function useListings(overrideParams) {
  const { filters } = useListingsStore();
  const params = overrideParams || filters;

  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => listingsApi.searchListings(params),
    keepPreviousData: true,
  });
}

export function useListing(id) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getListing(id),
    enabled: !!id,
  });
}

export function useMyListings(status) {
  return useQuery({
    queryKey: ['my-listings', status],
    queryFn: () => listingsApi.getMyListings(status),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: listingsApi.createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Listing created!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create listing');
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => listingsApi.updateListing(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Listing updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to update listing');
    },
  });
}

export function useMatches(listingId) {
  return useQuery({
    queryKey: ['matches', listingId],
    queryFn: () => listingsApi.getMatches(listingId),
    enabled: !!listingId,
  });
}

export function useSuggested() {
  return useQuery({
    queryKey: ['suggested'],
    queryFn: () => listingsApi.getSuggested(),
  });
}
