import React from 'react';
import { ShieldCheck, Inbox, Search, Sparkles, Truck, ClipboardList, FileText, AlertTriangle, Sprout, Building2, IndianRupee } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'default' | 'listings' | 'orders' | 'schemes' | 'reports' | 'matches' | 'notifications' | 'pools' | 'finance';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const variantConfigs: Record<string, { icon: React.ReactNode; defaultTitle: string; defaultDescription: string }> = {
  default: {
    icon: <Inbox className="w-10 h-10 text-cream-500" />,
    defaultTitle: 'No data available',
    defaultDescription: 'There\'s nothing here yet.',
  },
  listings: {
    icon: <Sprout className="w-10 h-10 text-botanical-400" />,
    defaultTitle: 'No harvest listings yet',
    defaultDescription: 'Create your first listing to start selling directly to buyers.',
  },
  orders: {
    icon: <ClipboardList className="w-10 h-10 text-deepteal-400" />,
    defaultTitle: 'No orders yet',
    defaultDescription: 'Orders will appear here once buyers commit to your listings.',
  },
  schemes: {
    icon: <Building2 className="w-10 h-10 text-botanical-400" />,
    defaultTitle: 'No matching schemes',
    defaultDescription: 'No government schemes matched your current profile and filters.',
  },
  reports: {
    icon: <AlertTriangle className="w-10 h-10 text-copper-400" />,
    defaultTitle: 'No safety reports',
    defaultDescription: 'Reports you submit or admin actions will appear here.',
  },
  matches: {
    icon: <Search className="w-10 h-10 text-olive-400" />,
    defaultTitle: 'No matches found',
    defaultDescription: 'No listings match your current filters. Try adjusting your search.',
  },
  notifications: {
    icon: <FileText className="w-10 h-10 text-cream-500" />,
    defaultTitle: 'No notifications',
    defaultDescription: 'You\'re all caught up. New alerts will appear here.',
  },
  pools: {
    icon: <Truck className="w-10 h-10 text-olive-400" />,
    defaultTitle: 'No logistics pools',
    defaultDescription: 'Pools will appear when confirmed orders are grouped for pickup.',
  },
  finance: {
    icon: <IndianRupee className="w-10 h-10 text-olive-400" />,
    defaultTitle: 'No finance data',
    defaultDescription: 'Working capital advances and history will appear here.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  action,
  className = '',
}) => {
  const config = variantConfigs[variant] || variantConfigs.default;

  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-lg bg-bg-800 border border-bg-700 flex items-center justify-center mx-auto mb-3">
        {config.icon}
      </div>
      <h3 className="font-display text-base font-semibold text-cream-100 mb-1.5">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-cream-400 max-w-sm mx-auto mb-5">
        {description || config.defaultDescription}
      </p>
      {action && <div className="w-full max-w-sm">{action}</div>}
    </div>
  );
};