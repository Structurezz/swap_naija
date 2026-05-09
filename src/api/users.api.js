import client from './client';

export const getMe = () => client.get('/users/me').then(r => r.data.data);
export const updateMe = (data) => client.patch('/users/me', data).then(r => r.data.data);
export const uploadAvatar = (formData) => client.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
export const getPublicProfile = (userId) => client.get(`/users/${userId}`).then(r => r.data.data);
export const getMyReferrals   = ()       => client.get('/users/me/referrals').then(r => r.data.data);
export const applyReferral    = (code)   => client.post('/users/referral/apply', { code }).then(r => r.data.data);
