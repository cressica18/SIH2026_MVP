import React from 'react';
import { ShieldCheck, Inbox, Search, Sparkles, Truck, ClipboardList, FileText, AlertTriangle, Sprout, Building2, IndianRupee, Star, Leaf, Navigation, Users, Package } from 'lucide-react';

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
    icon: <Sprout className="w-10 h-10 text-forest-400" />,
    defaultTitle: 'No harvest listings yet',
    defaultDescription: 'Create your first listing to start selling directly to buyers.',
  },
  orders: {
    icon: <ClipboardList className="w-10 h-10 text-teal-400" />,
    defaultTitle: 'No orders yet',
    defaultDescription: 'Orders will appear here once buyers commit to your listings.',
  },
  schemes: {
    icon: <Building2 className="w-10 h-10 text-forest-400" />,
    defaultTitle: 'No matching schemes',
    defaultDescription: 'No government schemes matched your current profile and filters.',
  },
  reports: {
    icon: <AlertTriangle className="w-10 h-10 text-copper-400" />,
    defaultTitle: 'No safety reports',
    defaultDescription: 'Reports you submit or admin actions will appear here.',
  },
  matches: {
    icon: <Search className="w-10 h-10 text-harvest-400" />,
    defaultTitle: 'No matches found',
    defaultDescription: 'No listings match your current filters. Try adjusting your search.',
  },
  notifications: {
    icon: <FileText className="w-10 h-10 text-cream-500" />,
    defaultTitle: 'No notifications',
    defaultDescription: 'You\'re all caught up. New alerts will appear here.',
  },
  pools: {
    icon: <Truck className="w-10 h-10 text-harvest-400" />,
    defaultTitle: 'No logistics pools',
    defaultDescription: 'Pools will appear when confirmed orders are grouped for pickup.',
  },
  finance: {
    icon: <IndianRupee className="w-10 h-10 text-harvest-400" />,
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
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-20 h-20 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center mx-auto mb-4">
        {config.icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-cream-400 max-w-sm mx-auto mb-6">
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

export const EmptyStateIllustrated: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-24 h-24 rounded-2xl bg-bg-800 border border-bg-700 flex items-center justify-center mx-auto mb-5">
        {icon || <Inbox className="w-12 h-12 text-cream-500" />}
      </div>
      <h3 className="font-display text-xl font-semibold text-cream-50 mb-2">
        {title}
      </h3>
      <p className="text-sm text-cream-400 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="w-full max-w-sm">
          {action}
        </div>
      )}
    </div>
  );
};