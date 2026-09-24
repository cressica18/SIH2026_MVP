import React, { useState } from 'react';
import {
  LogisticsProfile,
  LogisticsPool,
  Language,
  Order,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Fuel,
  Leaf,
  Navigation,
  Phone,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge, StatusBadge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

interface LogisticsViewProps {
  logistics: LogisticsProfile;
  pools: LogisticsPool[];
  orders?: Order[];
  currentLanguage: Language;
  onUpdatePoolStatus: (poolId: string, status: 'assigned' | 'in_transit' | 'delivered') => Promise<boolean>;
  onCompleteStop: (poolId: string, stopId: string) => Promise<boolean>;
  onCreatePool?: (orderIds: string[]) => Promise<boolean>;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  logistics,
  pools,
  orders = [],
  currentLanguage,
  onUpdatePoolStatus,
  onCompleteStop,
  onCreatePool,
}) => {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '');
  const [selectedOrdersForPool, setSelectedOrdersForPool] = useState<string[]>([]);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  const t = I18N_STRINGS[currentLanguage];

  const currentPool = pools.find((p) => p.id === selectedPoolId) || pools[0];

  // Fleet-wide metrics derived from actual pool data
  const totalCarbonReduced = pools.reduce((sum, p) => sum + (p.carbonReducedKg || 0), 0);
  const avgFuelSavings = pools.length > 0
    ? Math.round(pools.reduce((sum, p) => sum + (p.fuelSavingsPercent || 0), 0) / pools.length)
    : 0;
  
  const unassignedOrders = orders.filter(o => o.status === 'confirmed' && !o.poolId);

  const handleCreatePoolClick = async () => {
    if (selectedOrdersForPool.length === 0) {
      setPoolError('Please select at least one confirmed order to create a logistics pool.');
      return;
    }

    if (onCreatePool) {
      setIsCreatingPool(true);
      setPoolError(null);
      try {
        const success = await onCreatePool(selectedOrdersForPool);
        if (success) {
          setSelectedOrdersForPool([]);
        } else {
          setPoolError('Failed to create logistics pool. Please check order availability or capacity.');
        }
      } catch {
        setPoolError('An error occurred while creating pool.');
      } finally {
        setIsCreatingPool(false);
      }
    }
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrdersForPool(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Logistics Header Banner */}
      <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 text-white border-none shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="warning" size="sm" className="bg-amber-500/20 text-amber-200 border-amber-500/40">
                <Truck className="w-3.5 h-3.5" />
                Logistics Carrier Partner
              </Badge>
              <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                <Leaf className="w-3.5 h-3.5" />
                Pooled Route Optimization (VRP)
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {logistics.name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-stone-200 font-semibold">
              Vehicle: {logistics.vehicleType} • Service Radius: {logistics.serviceRadiusKm} km • Base: {logistics.district}, {logistics.state}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-stone-200 font-semibold">Fleet Fuel Savings</p>
              <p className="text-base font-black text-amber-300">
                ~{avgFuelSavings}% Saved
              </p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-stone-200 font-semibold">Carbon Abated</p>
              <p className="text-base font-black text-emerald-300">
                {totalCarbonReduced.toFixed(1)} kg CO₂
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Create Pool Section */}
      {unassignedOrders.length > 0 && (
        <Card variant="bordered" padding="md" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="w-5 h-5 text-amber-600" />
                <span>Unassigned Confirmed Orders in Corridor</span>
              </CardTitle>
              <CardDescription className="text-stone-600 font-medium">
                Select multiple farmgate harvest orders to cluster into a high-efficiency vehicle pickup route.
              </CardDescription>
            </div>
            <Button
              variant="primary"
              onClick={handleCreatePoolClick}
              disabled={selectedOrdersForPool.length === 0 || isCreatingPool}
              loading={isCreatingPool}
            >
              <Layers className="w-4 h-4" />
              <span>Create Optimized Pool ({selectedOrdersForPool.length})</span>
            </Button>
          </div>

          {poolError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
              {poolError}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unassignedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => toggleOrderSelection(order.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedOrdersForPool.includes(order.id)
                    ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-900 text-sm">{order.crop}</span>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-stone-300 font-bold text-stone-900">{order.id}</span>
                </div>
                <div className="text-xs text-stone-700 space-y-1 font-medium">
                  <p>Payload: <span className="font-bold text-stone-900">{order.quantityKg} kg</span></p>
                  <p className="truncate">Pickup: <span className="font-bold text-stone-900">{order.sellerVillage}, {order.sellerDistrict}</span></p>
                  <p className="truncate">Delivery: <span className="font-bold text-stone-900">{order.deliveryAddress.split(',')[0]}</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pools & Route Optimizer Section */}
      {currentPool ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Pool Overview & Capacity Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card variant="bordered" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-stone-900 text-amber-300">
                  {currentPool.id}
                </span>
                <StatusBadge status={currentPool.status} />
              </div>

              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {currentPool.clusterRegion}
                </h3>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  Pooled Date: {currentPool.date} • {currentPool.orderIds.length} Combined Orders
                </p>
              </div>

              {/* Capacity Progress Bar */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-stone-800">
                  <span>Vehicle Payload Utilization:</span>
                  <span className="font-black text-stone-900">
                    {currentPool.totalWeightKg} / {currentPool.maxCapacityKg} kg (
                    {Math.round((currentPool.totalWeightKg / currentPool.maxCapacityKg) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentPool.totalWeightKg / currentPool.maxCapacityKg) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-emerald-900 font-semibold flex items-center gap-1 pt-0.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  {currentPool.orderIds.length > 1
                    ? `Consolidating ${currentPool.orderIds.length} pickups reduces empty haulage miles.`
                    : 'Single pickup lot.'}
                </p>
              </div>

              {/* Vehicle & Driver Details */}
              <div className="text-xs space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 font-medium">
                <div className="flex justify-between">
                  <span className="text-stone-600 font-semibold">Assigned Carrier:</span>
                  <span className="font-bold text-stone-900">{currentPool.vehicleAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600 font-semibold">Driver Contact:</span>
                  <span className="font-bold text-emerald-800">{currentPool.driverName} ({currentPool.driverPhone})</span>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="space-y-2 pt-2">
                {currentPool.status !== 'in_transit' && currentPool.status !== 'delivered' && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onUpdatePoolStatus(currentPool.id, 'in_transit')}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Carrier (Mark In-Transit)</span>
                  </Button>
                )}

                {currentPool.status === 'in_transit' && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onUpdatePoolStatus(currentPool.id, 'delivered')}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm All Stops Delivered</span>
                  </Button>
                )}

                {currentPool.status === 'delivered' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Route Completed & Settled</span>
                  </div>
                )}
              </div>

            </Card>
          </div>

          {/* Right: Capacitated VRP Route Stops & Visual Map */}
          <div className="lg:col-span-2 space-y-4">
            <Card variant="bordered" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <span>Optimized Waypoint Sequence (NN Heuristic)</span>
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-medium">
                    Waypoints ordered to minimize vehicle turnaround time and fuel expenditure.
                  </CardDescription>
                </div>
                <Badge variant="neutral" size="sm">
                  {currentPool.routeStops.length} Waypoints
                </Badge>
              </div>

              {/* Waypoint Route List */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-300">
                {currentPool.routeStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`relative p-4 rounded-xl border transition-colors ${
                      stop.completed
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-stone-200 shadow-2xs'
                    }`}
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[19px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${
                        stop.completed
                          ? 'bg-emerald-600 border-white text-white'
                          : 'bg-white border-emerald-600 text-emerald-800'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={stop.stopType === 'pickup' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {stop.stopType === 'pickup' ? 'Pickup' : 'Dropoff'}
                          </Badge>
                          <span className="font-bold text-sm text-stone-900">
                            {stop.locationName}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 mt-1 font-semibold">
                          Contact: <span className="font-bold text-stone-900">{stop.farmerOrBuyerName}</span> ({stop.contactPhone})
                        </p>
                        <p className="text-xs text-stone-600 mt-0.5 font-bold">
                          Load: {stop.quantityKg} kg • {stop.crop}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {stop.completed ? (
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onCompleteStop(currentPool.id, stop.id)}
                          >
                            Mark Stop Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Route Map Simulation Schematic */}
              <div className="p-4 bg-stone-900 rounded-2xl text-white space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    Route Corridor ({currentPool.routeStops.length} stops)
                  </span>
                  <span className="font-mono text-stone-300 font-bold">Vehicle: {currentPool.vehicleAssigned}</span>
                </div>
                <div className="p-3 bg-stone-800 rounded-xl border border-stone-700 flex flex-wrap gap-2 items-center text-[11px] text-stone-200 font-mono">
                  {currentPool.routeStops.map((stop) => {
                    const isCompleted = stop.completed;
                    return (
                      <span
                        key={stop.id}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 ${
                          isCompleted ? 'bg-emerald-800/80 text-emerald-200 border border-emerald-600' : 'bg-stone-700 text-stone-100'
                        }`}
                      >
                        {stop.stopType === 'pickup' ? (
                          <Package className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-sky-300" />
                        )}
                        <span>{stop.locationName}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

            </Card>
          </div>

        </div>
      ) : (
        <EmptyState variant="pools" />
      )}

    </div>
  );
};
