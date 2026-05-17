import client from './client';

export const getDisputeRoom = (swapId) =>
  client.get(`/dispute/swap/${swapId}`).then(r => r.data.data);

export const sendDisputeMessage = (roomId, content, messageType = 'text') =>
  client.post(`/dispute/room/${roomId}/message`, { content, messageType }).then(r => r.data.data);

export const findLawyers = (params = {}) =>
  client.get('/dispute/lawyers', { params }).then(r => r.data.data);

export const requestCounsel = (roomId, counselId, proposedFeeKobo) =>
  client.post(`/dispute/room/${roomId}/counsel`, { counselId, proposedFeeKobo }).then(r => r.data.data);

export const respondToCounselRequest = (roomId, requestId, accept, agreedFeeKobo) =>
  client.put(`/dispute/room/${roomId}/counsel/${requestId}`, { accept, agreedFeeKobo }).then(r => r.data.data);
