import client from './client';

export const getMySwaps      = (status) => client.get('/swaps', { params: { status } }).then(r => r.data.data);
export const getSwap         = (id)     => client.get(`/swaps/${id}`).then(r => r.data.data);
export const getEscrowInfo   = ()       => client.get('/swaps/escrow-info').then(r => r.data.data);
export const proposeSwap     = (data)   => client.post('/swaps', data).then(r => r.data.data);
export const respondToSwap   = (id, action) => client.patch(`/swaps/${id}/respond`, { action }).then(r => r.data.data);
export const setMeetup       = (id, data)   => client.patch(`/swaps/${id}/meetup`, data).then(r => r.data.data);
export const payEscrowDeposit = (id)    => client.patch(`/swaps/${id}/escrow`).then(r => r.data.data);
export const confirmSwap     = (id)     => client.patch(`/swaps/${id}/confirm`).then(r => r.data.data);
export const disputeSwap     = (id, reason) => client.patch(`/swaps/${id}/dispute`, { reason }).then(r => r.data.data);
