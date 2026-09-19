import React from 'react';
import { ShieldCheck, Inbox, Search, Sparkles, Truck, ClipboardList, FileText, AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'default' | 'listings' | 'orders' | 'schemes' | 'reports' | 'matches' | 'notifications' | 'pools';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const variantConfigs: Record<string, { icon: React.ReactNode; defaultTitle: string; defaultDescription: string }> = {
  default: {
    icon: <Inbox className="w-12 h-12 text-stone-300" />,
    defaultTitle: 'No data available',
    defaultDescription: 'There\'s nothing here yet.',
  },
  listings: {
    icon: <Sparkles className="w-12 h-12 text-emerald-300" />,
    defaultTitle: 'No harvest listings yet',
    defaultDescription: 'Create your first listing to start selling directly to buyers.',
  },
  orders: {
    icon: <ClipboardList className="w-12 h-12 text-blue-300" />,
    defaultTitle: 'No orders yet',
    defaultDescription: 'Orders will appear here once buyers commit to your listings.',
  },
  schemes: {
    icon: <ShieldCheck className="w-12 h-12 text-purple-300" />,
    defaultTitle: 'No matching schemes',
    defaultDescription: 'No government schemes matched your current profile and filters.',
  },
  reports: {
    icon: <AlertTriangle className="w-12 h-12 text-rose-300" />,
    defaultTitle: 'No safety reports',
    defaultDescription: 'Reports you submit or admin actions will appear here.',
  },
  matches: {
    icon: <Search className="w-12 h-12 text-amber-300" />,
    defaultTitle: 'No matches found',
    defaultDescription: 'No listings match your current filters. Try adjusting your search.',
  },
  notifications: {
    icon: <FileText className="w-12 h-12 text-stone-300" />,
    defaultTitle: 'No notifications',
    defaultDescription: 'You\'re all caught up. New alerts will appear here.',
  },
  pools: {
    icon: <Truck className="w-12 h-12 text-amber-300" />,
    defaultTitle: 'No logistics pools',
    defaultDescription: 'Pools will appear when confirmed orders are grouped for pickup.',
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
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-24 h-24 rounded-2xl bg-stone-50 flex items-center justify-center mx-auto mb-4">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
        {description || config.defaultDescription}
      </p>
      {action && (
        <div className="w-full max-w-sm">
          {action}
        </div>
      )}
    </div>
  );
};