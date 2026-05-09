import client from './client';

export const getCategories = () => client.get('/categories').then(r => r.data.data);
