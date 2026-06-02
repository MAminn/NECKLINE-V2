import { useState, useMemo } from "react";
import { 
  BarChart3, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, Users, ShoppingBag, 
  Percent, DollarSign, Eye, RefreshCw, RotateCcw
} from "lucide-react";

interface AnalyticsMetric {
  revenueToday: number;
  totalRevenue: number;
  ordersCount: number;
  conversionRate: number;
  returningRate: number;
  newCustomers: number;
  pendingCount: number;
  processingCount: number;
  averageOrderValue: number;
  visitsHistory: { date: string; visits: number; checkouts: number }[];
  liveSessions: number;
  categoryShare?: { name: string; share: number; color: string }[];
  forecast?: { increase: number; recommendedStock: number; topProduct: string; projectedRevenue: number };
}

interface AdminAnalyticsTabProps {
  metrics: AnalyticsMetric;
  onRefresh: () => void;
  onResetAnalytics?: () => void;
}

export default function AdminAnalyticsTab({ metrics, onRefresh, onResetAnalytics }: AdminAnalyticsTabProps) {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "ALL">("7D");
  
  // Real dynamic CAC / MER metrics would be fetched here
  const cacValue = 0; 
  const merValue = 0; 

  // Generate SVG coordinates for dynamic charting from visitsHistory
  const chartCoordinates = useMemo(() => {
    const data = metrics.visitsHistory || [];
    if (data.length === 0) return { linePath: "", areaPath: "", points: [] };

    const width = 800;
    const height = 240;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => d.visits)) || 1000;
    const minVal = Math.min(...data.map(d => d.visits)) || 0;
    const range = maxVal - minVal || 100;

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.visits - minVal) / range) * (height - padding * 2);
      return { x, y, date: d.date, value: d.visits };
    });

    const linePath = points.reduce((acc, p, index) => {
      return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return { linePath, areaPath, points };
  }, [metrics]);

  return (
    <div className="p-8 space-y-8" id="analytics-tab-wrapper text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-extrabold">Aura Intel & Forecasting</h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Real-time computing of conversion rates, Customer Acquisition Costs, and e-commerce growth curves.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {["7D", "30D", "ALL"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
                timeframe === tf
                  ? "bg-[#D21B27] text-white"
                  : "border border-white/5 bg-white/[0.01]/60 text-zinc-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
          
          <button
            onClick={onRefresh}
            className="p-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg cursor-pointer text-neutral-400 hover:text-stone-200"
            title="Recalculate models"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (true) {
                onResetAnalytics?.();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-500/20 bg-red-950/10 hover:bg-red-500/10 rounded-lg cursor-pointer text-[#D21B27] hover:text-red-400 font-mono text-[10px] uppercase font-bold transition-all"
            title="Reset All Analytics & Event Logs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Advanced performance indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left" id="analytics-indices-grid">
        {/* CAC Box */}
        <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">CUSTOMER ACQUISITION (CAC)</span>
          <h3 className="text-3xl font-serif text-[#C29F68] tracking-wide font-extrabold mt-2">
            {cacValue || "N/A"} <span className="text-xs font-normal text-zinc-400">EGP</span>
          </h3>
          <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live calculation pending
          </span>
        </div>

        {/* MER Box */}
        <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">MARKETING EFFICIENCY (MER)</span>
          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
            {merValue} <span className="text-xs font-normal text-zinc-400">x ROI</span>
          </h3>
          <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3">
            Excellent budget allocation scale
          </span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">AVERAGE ORDER VALUE (AOV)</span>
          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
            {metrics.averageOrderValue || 0} <span className="text-xs font-normal text-stone-400">EGP</span>
          </h3>
          <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live metric sync
          </span>
        </div>

        {/* Live Active Streams */}
        <div className="p-6 rounded-2xl border border-white/[0.05] bg-[#1F0D0F]/45 border-[#D21B27]/15">
          <span className="text-[9px] uppercase tracking-widest font-mono text-[#D21B27] font-bold">LIVE VISITOR STREAMS</span>
          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            {metrics.liveSessions}
          </h3>
          <span className="text-[9px] font-mono text-neutral-400 block mt-3 select-none">
            Active browser pings Cairo-wide
          </span>
        </div>
      </div>

      {/* Main Graph Card */}
      <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md text-left" id="analytics-chart-container">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C29F68] font-bold">Scent Traffic Trends</span>
            <h4 className="text-lg font-serif text-white uppercase tracking-wider">Hourly Sessions & Conversion Index</h4>
          </div>
          <p className="text-[11px] font-mono text-neutral-400">
            Total Traffic: <span className="font-bold text-white">{(metrics.visitsHistory || []).reduce((sum, v) => sum + v.visits, 0)} sessions</span>
          </p>
        </div>

        {/* Dynamic SVG Chart */}
        <div className="w-full overflow-hidden" id="analytics-svg-wrapper">
          <svg viewBox="0 0 800 240" className="w-full h-auto text-[#D21B27] overflow-visible">
            <defs>
              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D21B27" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#D21B27" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Grid background lines */}
            {[0, 1, 2, 3].map(i => (
              <line 
                key={i}
                x1="20"
                y1={20 + i * 65}
                x2="780"
                y2={20 + i * 65}
                stroke="rgba(255,255,255,0.03)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Path */}
            {chartCoordinates.areaPath && (
              <path 
                d={chartCoordinates.areaPath}
                fill="url(#analyticsGradient)"
              />
            )}

            {/* Main line Path */}
            {chartCoordinates.linePath && (
              <path 
                d={chartCoordinates.linePath}
                fill="none"
                stroke="#D21B27"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_4px_10px_rgba(210,27,39,0.3)]"
              />
            )}

            {/* Interactive Points circles */}
            {chartCoordinates.points.map((pt, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle 
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#000"
                  stroke="#D21B27"
                  strokeWidth="2"
                  className="transition-transform hover:scale-150"
                />
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  className="fill-stone-300 font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black duration-200"
                >
                  {pt.value}
                </text>
              </g>
            ))}

            {/* Ticks Label text */}
            {chartCoordinates.points.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y="235"
                textAnchor="middle"
                className="fill-zinc-600 font-mono text-[9px] select-none"
              >
                {pt.date}
              </text>
            ))}
          </svg>
        </div>

      </div>

      {/* Grid columns of forecasting and categories ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left" id="analytics-splits">
        
        {/* Category Performance Breakdown */}
        <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]/45" id="categories-analysis">
          <h4 className="text-sm font-serif text-white uppercase tracking-widest mb-6">Visual Scent Distribution Rank</h4>
          <div className="space-y-4">
            
            {metrics.categoryShare && metrics.categoryShare.length > 0 ? (
              metrics.categoryShare.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[11px] font-mono mb-1 text-neutral-350 mx-1 uppercase">
                    <span>{cat.name}</span>
                    <span className="text-white font-bold">{cat.share}% Share</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-900 w-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${cat.share}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-neutral-400 font-light">Insufficient order history for category breakdown.</div>
            )}

          </div>
        </div>

        {/* AI Forecasting module */}
        <div className="p-6 rounded-2xl border border-[#D21B27]/10 bg-gradient-to-br from-[#1F0D0F]/30 to-black" id="forecasting-analysis">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400">✦</span>
            <span className="text-[10px] font-mono text-[#C29F68] font-bold uppercase tracking-widest">Aura Smart Model Forecasting</span>
          </div>
          
          {metrics.forecast ? (
            <>
              <h4 className="text-[16px] font-serif text-white uppercase tracking-wider mb-2">
                {metrics.forecast.increase > 0 ? "Revenue Surge Anticipated" : "Standard Growth Projection"}
              </h4>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed mb-4">
                Based on active live session triggers and trailing search interest trends, the system projects an organic 
                <strong className="text-white"> {metrics.forecast.increase}% {metrics.forecast.increase > 0 ? 'increase' : 'shift'} </strong> 
                in weekly checkouts over the following 6 days. Recommended stock buffer level is <strong className="text-white">{metrics.forecast.recommendedStock} units</strong> for "{metrics.forecast.topProduct}".
              </p>
              <div className="py-2.5 px-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center text-xs">
                <span className="text-neutral-400">Predicted Revenue Margin (L6D)</span>
                <span className="font-mono text-emerald-400 font-bold">+{metrics.forecast.projectedRevenue.toLocaleString()} EGP</span>
              </div>
            </>
          ) : (
             <div className="text-xs text-neutral-400 font-light mt-8">Dynamic forecasting requires more live transaction analytics.</div>
          )}
        </div>

      </div>
    </div>
  );
}
