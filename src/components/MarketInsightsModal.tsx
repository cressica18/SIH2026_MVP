import React, { useState } from 'react';
import { SEED_MARKET_INSIGHTS } from '../data/seedData';
import { MarketInsight } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Calendar,
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MarketInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketInsightsModal: React.FC<MarketInsightsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');

  if (!isOpen) return null;

  const currentInsight: MarketInsight =
    SEED_MARKET_INSIGHTS.find((m) => m.crop === selectedCrop) ||
    SEED_MARKET_INSIGHTS[0];

  const history = currentInsight.history;
  const minPrice = Math.min(...history.map((h) => h.price)) * 0.9;
  const maxPrice = Math.max(...history.map((h) => h.price)) * 1.1;

  // Generate SVG path for the 7-point line chart
  const svgWidth = 460;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 20;

  const points = history.map((item, index) => {
    const x =
      paddingX +
      (index / (history.length - 1)) * (svgWidth - 2 * paddingX);
    const y =
      svgHeight -
      paddingY -
      ((item.price - minPrice) / (maxPrice - minPrice)) *
        (svgHeight - 2 * paddingY);
    return { x, y, price: item.price, date: item.date, arrivals: item.arrivalsTons };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    svgHeight - paddingY
  } L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Agmarknet Mandi Price Intelligence
              </h3>
              <p className="text-xs text-emerald-200">
                Live Mandi trends, arrival volumes & AI price forecasting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Crop Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SEED_MARKET_INSIGHTS.map((m) => (
              <button
                key={m.crop}
                onClick={() => setSelectedCrop(m.crop)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCrop === m.crop
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {m.crop}
              </button>
            ))}
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-stone-500">
                Current Avg Price
              </p>
              <p className="text-lg font-extrabold text-stone-900 mt-0.5">
                ₹{currentInsight.currentAvgPrice}/kg
              </p>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-stone-500">
                7-Day Momentum
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {currentInsight.changePercent >= 0 ? (
                  <span className="text-emerald-700 font-extrabold text-sm flex items-center">
                    <ArrowUpRight className="w-4 h-4" />
                    +{currentInsight.changePercent}%
                  </span>
                ) : (
                  <span className="text-rose-700 font-extrabold text-sm flex items-center">
                    <ArrowDownRight className="w-4 h-4" />
                    {currentInsight.changePercent}%
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-stone-500">
                Price Volatility
              </p>
              <p className="text-sm font-bold text-stone-800 mt-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                {currentInsight.volatilityIndex}
              </p>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-stone-500">
                AI Next-Week Forecast
              </p>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                ₹{currentInsight.forecastNextWeek}/kg
              </p>
            </div>
          </div>

          {/* SVG Price Line Chart */}
          <div className="p-4 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Historical 7-Week APMC Mandi Trajectory</span>
              </div>
              <span className="text-stone-400 text-[11px]">
                Arrivals vs Wholesale Rate
              </span>
            </div>

            <div className="w-full overflow-x-auto flex justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-w-lg h-44"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path d={areaD} fill="url(#chartGradient)" />

                {/* Base guideline */}
                <line
                  x1={paddingX}
                  y1={svgHeight - paddingY}
                  x2={svgWidth - paddingX}
                  y2={svgHeight - paddingY}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill="#e5e7eb"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ₹{pt.price}
                    </text>
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="9"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* AI Market Summary */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Market Narrative (Grounded in Agmarknet Data)</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {currentInsight.aiSummary}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Insights
          </button>
        </div>

      </div>
    </div>
  );
};
