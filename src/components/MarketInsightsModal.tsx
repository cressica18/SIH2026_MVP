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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bg-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-bg-850 rounded-3xl shadow-2xl border border-bg-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-forest-900/50 border-b border-forest-700 text-cream-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bg-800 rounded-xl border border-bg-700">
              <TrendingUp className="w-5 h-5 text-forest-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-cream-50">
                Agmarknet Mandi Price Intelligence
              </h3>
              <p className="text-xs text-forest-300 font-semibold">
                Live Mandi trends, arrival volumes & AI price forecasting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-cream-400 hover:text-cream-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Crop Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SEED_MARKET_INSIGHTS.map((m) => (
              <button
                key={m.crop}
                onClick={() => setSelectedCrop(m.crop)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCrop === m.crop
                    ? 'bg-forest-600 text-bg-950 shadow-xs'
                    : 'bg-bg-800 text-cream-300 hover:bg-bg-750 hover:text-cream-50 border border-bg-700'
                }`}
              >
                {m.crop}
              </button>
            ))}
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-bg-750 border border-bg-700 rounded-2xl">
              <p className="text-[11px] font-bold text-cream-500">
                Current Avg Price
              </p>
              <p className="text-lg font-black text-cream-50 mt-0.5">
                ₹{currentInsight.currentAvgPrice}/kg
              </p>
            </div>

            <div className="p-3 bg-bg-750 border border-bg-700 rounded-2xl">
              <p className="text-[11px] font-bold text-cream-500">
                7-Day Momentum
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {currentInsight.changePercent >= 0 ? (
                  <span className="text-forest-300 font-black text-sm flex items-center">
                    <ArrowUpRight className="w-4 h-4" />
                    +{currentInsight.changePercent}%
                  </span>
                ) : (
                  <span className="text-copper-300 font-black text-sm flex items-center">
                    <ArrowDownRight className="w-4 h-4" />
                    {currentInsight.changePercent}%
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-bg-750 border border-bg-700 rounded-2xl">
              <p className="text-[11px] font-bold text-cream-500">
                Price Volatility
              </p>
              <p className="text-sm font-bold text-cream-50 mt-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-harvest-400" />
                {currentInsight.volatilityIndex}
              </p>
            </div>

            <div className="p-3 bg-bg-750 border border-bg-700 rounded-2xl">
              <p className="text-[11px] font-bold text-cream-500">
                AI Next-Week Forecast
              </p>
              <p className="text-lg font-black text-forest-300 mt-0.5">
                ₹{currentInsight.forecastNextWeek}/kg
              </p>
            </div>
          </div>

          {/* SVG Price Line Chart */}
          <div className="p-4 bg-bg-800 text-cream-50 rounded-2xl border border-bg-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-forest-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Historical 7-Week APMC Mandi Trajectory</span>
              </div>
              <span className="text-cream-500 text-[11px] font-semibold">
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
                    <stop offset="0%" stopColor="#1a853a" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1a853a" stopOpacity="0.0" />
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
                  stroke="#3d6b4f"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1a853a"
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
                      fill="#0a0f0d"
                      stroke="#1a853a"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill="#faf8f3"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ₹{pt.price}
                    </text>
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      fill="#c9bba5"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* AI Market Summary */}
          <div className="p-4 bg-forest-900/30 border border-forest-700 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-forest-100">
              <Sparkles className="w-4 h-4 text-harvest-400" />
              <span>AI Market Narrative (Grounded in Agmarknet Data)</span>
            </div>
            <p className="text-xs sm:text-sm text-cream-300 leading-relaxed font-medium">
              {currentInsight.aiSummary}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bg-750 border-t border-bg-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-800 hover:bg-bg-750 text-cream-50 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-bg-700"
          >
            Close Insights
          </button>
        </div>

      </div>
    </div>
  );
};