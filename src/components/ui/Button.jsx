import { motion } from 'framer-motion';
import Spinner from './Spinner';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed gap-2';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-600',
    outline: 'border-2 border-primary text-primary hover:bg-primary-50',
    ghost: 'text-primary hover:bg-primary-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    secondary: 'bg-gray-100 text-ink hover:bg-gray-200',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    icon: 'p-2',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" color={variant === 'primary' ? 'white' : 'primary'} /> : children}
    </motion.button>
  );
}

export default Button;
