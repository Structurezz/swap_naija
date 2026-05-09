import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';

const BADGE_CONFIG = {
  basic: { label: 'Basic', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-100' },
  verified: { label: 'Verified', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary-50' },
  premium: { label: 'Premium', icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10' },
};

function TrustBadge({ verification = 'basic' }) {
  const config = BADGE_CONFIG[verification] || BADGE_CONFIG.basic;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default TrustBadge;
