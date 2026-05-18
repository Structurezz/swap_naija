import client from './client';

export const sendOtp         = (phone)         => client.post('/auth/send-otp', { phone }).then(r => r.data.data);
export const verifyOtp       = (phone, code)   => client.post('/auth/verify-otp', { phone, code }).then(r => r.data.data);
export const sendEmailOtp    = (email)         => client.post('/auth/send-email-otp', { email }).then(r => r.data.data);
export const verifyEmailOtp  = (email, code)   => client.post('/auth/verify-email-otp', { email, code }).then(r => r.data.data);
export const register        = (data)          => client.post('/auth/register', data).then(r => r.data.data);
export const loginEmail      = (data)          => client.post('/auth/login', data).then(r => r.data.data);
export const loginOtp        = (data)          => client.post('/auth/login-otp', data).then(r => r.data.data);
export const forgotPassword  = (email)         => client.post('/auth/forgot-password', { email }).then(r => r.data.data);
export const resetPassword   = (data)          => client.post('/auth/reset-password', data).then(r => r.data.data);
export const changePassword  = (data)          => client.put('/auth/change-password', data).then(r => r.data.data);
export const deleteAccount   = (password)      => client.delete('/auth/account', { data: { password } }).then(r => r.data.data);
export const refreshToken    = (refreshToken)  => client.post('/auth/refresh', { refreshToken }).then(r => r.data.data);
export const logout          = (refreshToken)  => client.post('/auth/logout', { refreshToken }).then(r => r.data.data);
