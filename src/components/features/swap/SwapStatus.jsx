import Badge from '../../ui/Badge';

const STATUS_CONFIG = {
  proposed: { label: 'Proposed', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  shipped: { label: 'Shipped', variant: 'accent' },
  in_escrow: { label: 'In Escrow', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  disputed: { label: 'Disputed', variant: 'danger' },
};

function SwapStatus({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default SwapStatus;
