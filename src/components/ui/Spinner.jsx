import { motion } from 'framer-motion';
import { ArrowRightLeft } from 'lucide-react';

/**
 * SwapNaija logo loader.
 *
 * size="sm"  – inline, used inside buttons (16px icon only, no box)
 * size="md"  – small block loader (32px box)
 * size="lg"  – section loader (48px box)
 * size="xl"  – full-page loader (64px box + wordmark)
 */
function Spinner({ size = 'md', color = 'primary' }) {
  // Inline button variant — tiny pulsing arrows, no background box
  if (size === 'sm') {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="inline-flex"
        style={{ display: 'inline-flex' }}
      >
        <ArrowRightLeft
          size={16}
          className={color === 'white' ? 'text-white' : 'text-primary'}
          strokeWidth={2.5}
        />
      </motion.span>
    );
  }

  const boxSizes = { md: 32, lg: 48, xl: 64 };
  const iconSizes = { md: 16, lg: 22, xl: 30 };
  const box  = boxSizes[size]  ?? 48;
  const icon = iconSizes[size] ?? 22;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Outer pulse ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-2xl bg-primary"
          style={{ width: box, height: box }}
        />

        {/* Logo box */}
        <motion.div
          animate={{ scale: [0.92, 1, 0.92] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative bg-primary rounded-2xl flex items-center justify-center"
          style={{ width: box, height: box }}
        >
          {/* Arrows icon — continuous rotation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="flex items-center justify-center"
          >
            <ArrowRightLeft size={icon} className="text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      </div>

      {/* Wordmark for xl only */}
      {size === 'xl' && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="font-display font-bold text-primary text-sm tracking-wide"
        >
          SwapNaija
        </motion.p>
      )}
    </div>
  );
}

export default Spinner;
