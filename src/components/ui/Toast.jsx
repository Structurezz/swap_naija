// Toast is handled by react-hot-toast globally in main.jsx
// This component provides custom toast helpers
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const showToast = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  loading: (msg) => toast.loading(msg),
  dismiss: (id) => toast.dismiss(id),
  custom: (msg, opts) => toast(msg, opts),
};

export default showToast;
