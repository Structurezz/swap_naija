import client from './client';

export const getNotifPrefs = async () => {
  const { data } = await client.get('/notifications/preferences');
  return data.data;
};

export const updateNotifPrefs = async (prefs) => {
  const { data } = await client.patch('/notifications/preferences', prefs);
  return data.data;
};

export const unsubscribeAll = async () => {
  const { data } = await client.post('/notifications/unsubscribe');
  return data.data;
};
