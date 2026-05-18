import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import * as authApi from '../api/auth.api';

export function useAuth() {
  const { user, accessToken, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const onAuthSuccess = (data, isNew) => {
    setAuth(data.user, data.accessToken, data.refreshToken);
    navigate(data.isNewUser ?? isNew ? '/profile/edit' : '/');
  };

  const sendOtpMutation = useMutation({
    mutationFn: (phone) => authApi.sendOtp(phone),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send OTP'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, code }) => authApi.verifyOtp(phone, code),
    onSuccess: (data) => onAuthSuccess(data),
    onError: (err) => toast.error(err.response?.data?.error || 'Invalid OTP'),
  });

  const sendEmailOtpMutation = useMutation({
    mutationFn: (email) => authApi.sendEmailOtp(email),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send OTP'),
  });

  const verifyEmailOtpMutation = useMutation({
    mutationFn: ({ email, code }) => authApi.verifyEmailOtp(email, code),
    onSuccess: (data) => onAuthSuccess(data),
    onError: (err) => toast.error(err.response?.data?.error || 'Invalid or expired OTP'),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (data) => onAuthSuccess(data),
    onError: (err) => toast.error(err.response?.data?.error || 'Registration failed'),
  });

  const loginEmailMutation = useMutation({
    mutationFn: (data) => authApi.loginEmail(data),
    onSuccess: (data) => onAuthSuccess(data),
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed'),
  });

  const loginOtpMutation = useMutation({
    mutationFn: (data) => authApi.loginOtp(data),
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed'),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email) => authApi.forgotPassword(email),
    onError: (err) => toast.error(err.response?.data?.error || 'Request failed'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data) => authApi.resetPassword(data),
    onSuccess: () => { toast.success('Password reset! Please log in.'); navigate('/onboarding'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Reset failed'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => { toast.success('Password changed successfully'); navigate('/profile'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to change password'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (password) => authApi.deleteAccount(password),
    onSuccess: () => { storeLogout(); navigate('/onboarding'); toast.success('Account deleted'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete account'),
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      const token = useAuthStore.getState().refreshToken;
      return authApi.logout(token);
    },
    onSettled: () => { storeLogout(); navigate('/onboarding'); },
  });

  return {
    user,
    isAuthenticated: !!accessToken && !!user,
    sendOtp: sendOtpMutation.mutate,
    sendOtpAsync: sendOtpMutation.mutateAsync,
    isSendingOtp: sendOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.mutate,
    verifyOtpAsync: verifyOtpMutation.mutateAsync,
    isVerifying: verifyOtpMutation.isPending,
    sendEmailOtp: sendEmailOtpMutation.mutate,
    sendEmailOtpAsync: sendEmailOtpMutation.mutateAsync,
    isSendingEmailOtp: sendEmailOtpMutation.isPending,
    verifyEmailOtp: verifyEmailOtpMutation.mutate,
    verifyEmailOtpAsync: verifyEmailOtpMutation.mutateAsync,
    isVerifyingEmailOtp: verifyEmailOtpMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    loginEmail: loginEmailMutation.mutate,
    loginEmailAsync: loginEmailMutation.mutateAsync,
    isLoggingIn: loginEmailMutation.isPending,
    loginOtp: loginOtpMutation.mutate,
    loginOtpAsync: loginOtpMutation.mutateAsync,
    isLoginOtpPending: loginOtpMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isSendingReset: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResetting: resetPasswordMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    deleteAccount: deleteAccountMutation.mutate,
    isDeletingAccount: deleteAccountMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
