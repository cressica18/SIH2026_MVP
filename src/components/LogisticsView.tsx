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
} from 'lucide-react';

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
      <div className="bg-gradient-to-br from-amber-800 via-stone-900 to-stone-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-amber-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600/60 text-amber-200 border border-amber-500/40">
                Logistics Carrier Partner
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" />
                Pooled Route Optimization (NN Heuristic)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {logistics.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300">
              Vehicle: {logistics.vehicleType} • Service Radius: {logistics.serviceRadiusKm} km • Base: {logistics.district}, {logistics.state}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-stone-300 font-medium">Fleet Fuel Savings</p>
              <p className="text-base font-black text-amber-400">
                ~{avgFuelSavings}% Saved
              </p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-stone-300 font-medium">Carbon Abated</p>
              <p className="text-base font-black text-emerald-400">
                {totalCarbonReduced.toFixed(1)} kg CO₂
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Pool Section */}
      {unassignedOrders.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Unassigned Confirmed Orders
            </h3>
            <button
              onClick={handleCreatePoolClick}
              disabled={selectedOrdersForPool.length === 0 || isCreatingPool}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              {isCreatingPool ? 'Creating Pool...' : `Create Optimized Pool (${selectedOrdersForPool.length})`}
            </button>
          </div>

          {poolError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {poolError}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {unassignedOrders.map(order => (
              <div
                key={order.id}
                onClick={() => toggleOrderSelection(order.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedOrdersForPool.includes(order.id)
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                    : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-900 text-sm">{order.crop}</span>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border">{order.id}</span>
                </div>
                <div className="text-xs text-stone-600 space-y-1">
                  <p>Load: <span className="font-semibold text-stone-900">{order.quantityKg} kg</span></p>
                  <p className="truncate">From: {order.sellerVillage}, {order.sellerDistrict}</p>
                  <p className="truncate">To: {order.deliveryAddress.split(',')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pools & Route Optimizer Section */}
      {currentPool ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Pool Overview & Capacity Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-900 text-amber-300">
                  {currentPool.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {currentPool.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {currentPool.clusterRegion}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pooled Date: {currentPool.date} • {currentPool.orderIds.length} Combined Orders
                </p>
              </div>

              {/* Capacity Progress Bar */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-stone-700">
                  <span>Vehicle Payload Utilization:</span>
                  <span className="font-bold text-stone-900">
                    {currentPool.totalWeightKg} / {currentPool.maxCapacityKg} kg (
                    {Math.round((currentPool.totalWeightKg / currentPool.maxCapacityKg) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
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
                <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  {currentPool.orderIds.length > 1
                    ? `Consolidating ${currentPool.orderIds.length} pickups reduces empty haulage miles.`
                    : 'Single pickup — no pooling savings.'}
                </p>
              </div>

              {/* Vehicle & Driver Details */}
              <div className="text-xs space-y-1.5 p-3 bg-stone-50 rounded-xl border border-stone-100 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-400">Assigned Carrier:</span>
                  <span className="font-bold text-stone-900">{currentPool.vehicleAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Driver Contact:</span>
                  <span className="font-bold text-emerald-700">{currentPool.driverName} ({currentPool.driverPhone})</span>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="space-y-2 pt-2">
                {currentPool.status !== 'in_transit' && currentPool.status !== 'delivered' && (
                  <button
                    onClick={() => onUpdatePoolStatus(currentPool.id, 'in_transit')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Carrier (Mark In-Transit)</span>
                  </button>
                )}

                {currentPool.status === 'in_transit' && (
                  <button
                    onClick={() => onUpdatePoolStatus(currentPool.id, 'delivered')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm All Stops Delivered</span>
                  </button>
                )}

                {currentPool.status === 'delivered' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-900">
                    Route Completed & Settled
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right: Capacitated VRP Route Stops & Visual Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <span>Optimized Waypoint Sequence (NN Heuristic)</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Stops calculated to minimize vehicle turnaround and maximize fuel economy
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-stone-100 rounded-xl text-xs font-semibold text-stone-700">
                  {currentPool.routeStops.length} Waypoints
                </span>
              </div>

              {/* Waypoint Route List */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-200">
                {currentPool.routeStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`relative p-4 rounded-xl border transition-colors ${
                      stop.completed
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-stone-200 shadow-xs'
                    }`}
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[19px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
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
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              stop.stopType === 'pickup'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {stop.stopType}
                          </span>
                          <span className="font-bold text-sm text-stone-900">
                            {stop.locationName}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Contact: <span className="font-semibold text-stone-800">{stop.farmerOrBuyerName}</span> ({stop.contactPhone})
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Load: {stop.quantityKg} kg • {stop.crop}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {stop.completed ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => onCompleteStop(currentPool.id, stop.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            Mark Stop Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Route Map Simulation Schematic — derived from backend stops */}
              <div className="p-4 bg-stone-900 rounded-2xl text-white space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-bold text-emerald-400">
                    Route Corridor ({currentPool.routeStops.length} stops)
                  </span>
                  <span>Capacity: {currentPool.vehicleAssigned}</span>
                </div>
                <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700 flex flex-wrap gap-2 items-center text-[11px] text-stone-300 font-mono">
                  {currentPool.routeStops.map((stop, idx) => {
                    const isCompleted = stop.completed;
                    const prefix = stop.stopType === 'pickup' ? '🖑' : '📦';
                    return (
                      <span key={stop.id} className={`px-2 py-1 rounded ${
                        isCompleted ? 'bg-emerald-700/30' : 'bg-stone-700'
                      }`}>
                        {prefix} {stop.locationName}
                      </span>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
          No active logistics pickup pools currently open.
        </div>
      )}

    </div>
  );
};
