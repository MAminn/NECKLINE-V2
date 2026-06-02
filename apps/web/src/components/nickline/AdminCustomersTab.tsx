import { useState, useMemo, FormEvent } from "react";
import { 
  Search, Users, Mail, MapPin, DollarSign, Calendar, Eye, FileText, CheckCircle2, X, Plus, Sparkles, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, Phone, Check, RefreshCw, Trash2
} from "lucide-react";

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  date: string;
}

interface Customer {
  name: string;
  initials: string;
  avatarBg: string;
  location: string;
  ordersCount: number;
  clv: number;
  email: string;
  phone?: string;
  joinedDate?: string;
  tags?: string[];
  orders: CustomerOrder[];
}

interface AdminCustomersTabProps {
  customers: Customer[];
  onRefresh: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (val: string) => void;
  onDeleteCustomer?: (email: string) => void;
}

// Sparkline builder for deluxe UI visual matching
const Sparkline = ({ points, color = "#D21B27" }: { points: number[]; color?: string }) => {
  const width = 110;
  const height = 30;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - 4 - ((p - min) / range) * (height - 8)
  }));
  const path = coords.reduce((acc, c, i) => i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`, "");
  return (
    <svg width={width} height={height} className="overflow-visible pointer-events-none mt-1">
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function AdminCustomersTab({ 
  customers, 
  onRefresh,
  globalSearchQuery,
  onGlobalSearchChange,
  onDeleteCustomer
}: AdminCustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeSearch = globalSearchQuery !== undefined ? globalSearchQuery : searchQuery;

  const dispatchSearchChange = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setSearchQuery(val);
    }
  };

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<"ALL" | "ACTIVE" | "NEW" | "VIP">("ALL");
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D" | "90D">("7D");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustLocation, setNewCustLocation] = useState("Cairo");
  const [newCustTags, setNewCustTags] = useState("VIP COLLECTOR");

  // Local state to blend custom added clients in memory for real-time reactivity without page reload
  const [localAddedCustomers, setLocalAddedCustomers] = useState<Customer[]>([]);

  const handleDeleteClick = async (email: string, name: string) => {
    if (true) {
      try {
        setLocalAddedCustomers(prev => prev.filter(c => c.email !== email));
        if (onDeleteCustomer) {
          onDeleteCustomer(email);
        }
        if (selectedCustomer?.email === email) {
          setSelectedCustomer(null);
        }
      } catch (err) {
        console.error("Failed to delete customer:", err);
      }
    }
  };

  const mergedCustomers = useMemo(() => {
    // Merge database customers with any locally added ones
    const combined = [...localAddedCustomers, ...customers];
    // De-duplicate by email
    const unique: Customer[] = [];
    const seenEmails = new Set<string>();
    
    combined.forEach(c => {
      // Ensure phone and tags are populated
      const mockPhone = c.phone || "N/A";
      const mockJoined = c.joinedDate || "Unknown";
      const tags = c.tags || (c.clv > 2000 ? ["VIP", "SENSORY_GUILD"] : ["COLLECTOR"]);
      
      const hydrated: Customer = {
        ...c,
        phone: mockPhone,
        joinedDate: mockJoined,
        tags
      };

      if (!seenEmails.has(hydrated.email)) {
        seenEmails.add(hydrated.email);
        unique.push(hydrated);
      }
    });

    return unique;
  }, [customers, localAddedCustomers]);

  // Aggregate stats dynamically
  const stats = useMemo(() => {
    const total = mergedCustomers.length;
    const withOrders = mergedCustomers.filter(c => c.ordersCount > 0);
    const active = withOrders.length;
    
    // Repeat rate: customer with more than 1 order
    const repeatCusts = mergedCustomers.filter(c => c.ordersCount > 1).length;
    const repeatRate = total > 0 ? Math.round((repeatCusts / total) * 100) : 0;

    // Avg spent
    const totalSpentSum = mergedCustomers.reduce((sum, c) => sum + c.clv, 0);
    const avgSpend = total > 0 ? Math.round(totalSpentSum / total) : 0;

    return {
      total,
      active,
      newCount: total - active,
      repeatRate,
      avgSpend
    };
  }, [mergedCustomers]);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) return;

    const initials = newCustName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "AN";

    const bgs = [
      "bg-[#D21B27]/15 text-[#D21B27] border border-[#D21B27]/20",
      "bg-amber-500/15 text-amber-500 border border-amber-500/20",
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10",
      "bg-indigo-500/15 text-indigo-400 border border-indigo-500/10"
    ];
    const avatarBg = bgs[Math.floor(Math.random() * bgs.length)];

    const tagsArray = newCustTags.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);

    const newCust: Customer = {
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone || "Not Provided",
      location: newCustLocation,
      initials,
      avatarBg,
      ordersCount: 0,
      clv: 0,
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      tags: tagsArray.length ? tagsArray : ["COLLECTOR"],
      orders: []
    };

    setLocalAddedCustomers(prev => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    
    // Reset Form
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustLocation("Cairo");
    setNewCustTags("VIP COLLECTOR");
    setShowAddModal(false);
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "Location", "Orders", "Lifetime Value (EGP)", "Joined Date"];
    const rows = mergedCustomers.map(c => [
      c.name,
      c.email,
      c.phone || "",
      c.location,
      c.ordersCount,
      c.clv,
      c.joinedDate || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aura_Clientele_Registry_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // State filtering logic
  const filteredCustomers = useMemo(() => {
    return mergedCustomers.filter(c => {
      // 1. Search Query
      const query = activeSearch.toLowerCase().trim();
      const matchesSearch = 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        c.location.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (activeTableTab === "ACTIVE") return c.ordersCount > 0;
      if (activeTableTab === "NEW") return c.ordersCount === 0 || c.joinedDate?.includes("2026") || c.joinedDate?.includes("May 24");
      if (activeTableTab === "VIP") return c.clv >= 1000 || c.tags?.includes("VIP");
      return true; // ALL
    });
  }, [mergedCustomers, activeSearch, activeTableTab]);

  return (
    <div className="p-8 space-y-6 text-left" id="customers-tab-wrapper">
      
      {/* Visual Header Navigation Trackers */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          {/* Breadcrumb breadcrumb */}
          <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
            <span>Dashboard</span>
            <span>·</span>
            <span className="text-[#D21B27] font-bold">Clientele Directory</span>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-extrabold flex items-center gap-2">
              CUSTOMERS
              <span className="text-neutral-500 font-sans text-xs font-light py-0.5 px-2 bg-white/[0.03] rounded-lg tracking-normal border border-white/5 lowercase">
                all collectors v
              </span>
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Track user lifetime value (CLV), purchase telemetry, and fragrance matching traits in Giza & Cairo.
          </p>
        </div>

        {/* Header Control Buttons aligned to visual specs */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Timeline switch tabs */}
          <div className="flex bg-zinc-950/80 border border-white/5 rounded-full p-0.5" id="customer-timeframes">
            {(["24H", "7D", "30D", "90D"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full text-[9.5px] font-mono tracking-wider transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#D21B27] text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <button
            onClick={triggerRefresh}
            className="h-9 px-3 rounded-xl border border-white/5 bg-white/[0.02]/40 hover:bg-white/[0.05] text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Reload registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl border border-white/5 bg-white/[0.02]/30 hover:bg-white/[0.05] text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Export CSV"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-9 px-4 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#D21B27]/10"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* SECTION: 4 Summary Micro-Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="customers-stats-deck">
        
        {/* Card 1: Total Customers */}
        <div className="p-4 rounded-2xl border border-white/[0.05] bg-zinc-950/40 hover:border-white/10 transition-all flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[8.5px] uppercase tracking-wider font-mono text-zinc-500 font-bold block">TOTAL CLIENT REGISTER</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-serif text-white font-extrabold">{stats.total}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +24% vs L7D
              </span>
            </div>
            <span className="text-[9px] block text-neutral-500 font-light">Direct account creators</span>
          </div>
          <Sparkline points={[60, 65, 75, 78, 85, 98, 110, 118]} color="#D21B27" />
        </div>

        {/* Card 2: New Customers */}
        <div className="p-4 rounded-2xl border border-white/[0.05] bg-zinc-950/40 hover:border-white/10 transition-all flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[8.5px] uppercase tracking-wider font-mono text-zinc-500 font-bold block">NEW CUSTOMERS · {timeframe}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-serif text-white font-extrabold">{stats.newCount}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +16.3%
              </span>
            </div>
            <span className="text-[9px] block text-neutral-500 font-light">Anticipated sensory profiles</span>
          </div>
          <Sparkline points={[20, 35, 15, 45, 30, 52, 58, 67]} color="#C29F68" />
        </div>

        {/* Card 3: Repeat Rate */}
        <div className="p-4 rounded-2xl border border-white/[0.05] bg-zinc-950/40 hover:border-white/10 transition-all flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[8.5px] uppercase tracking-wider font-mono text-zinc-500 font-bold block">REPEAT COLLECTORS RATE</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-serif text-white font-extrabold">{stats.repeatRate}%</span>
              <span className="text-[9px] font-mono text-rose-500 font-semibold flex items-center gap-0.5 animate-pulse">
                ✦ High loyalty index
              </span>
            </div>
            <span className="text-[9px] block text-neutral-500 font-light">More than 1 active checkout</span>
          </div>
          <Sparkline points={[40, 42, 41, 45, 43, 44, 45, 45]} color="#a78bfa" />
        </div>

        {/* Card 4: Avg Spend */}
        <div className="p-4 rounded-2xl border border-white/[0.05] bg-zinc-950/40 hover:border-white/10 transition-all flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[8.5px] uppercase tracking-wider font-mono text-zinc-500 font-bold block">AVERAGE ORDER VALUE (AOV)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-serif text-emerald-400 font-extrabold">{stats.avgSpend} <span className="text-[10px] text-zinc-400 font-normal">EGP</span></span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +6.5% vs L7D
              </span>
            </div>
            <span className="text-[9px] block text-neutral-500 font-light">Basket telemetry averages</span>
          </div>
          <Sparkline points={[1000, 1100, 1050, 1200, 1180, 1230, 1210, 1240]} color="#10b981" />
        </div>

      </div>

      {/* GRID: MAIN TABLE WORKSPACE & SIDE INSPECTION TAB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Clientele Registry Table Area (Takes left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Table Level Filters Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-xl border border-white/5 bg-zinc-950/30">
            
            {/* Table Tabs */}
            <div className="flex gap-1.5 border-b border-white/[0.03] w-full sm:w-auto pb-2 sm:pb-0 font-mono text-[10px]">
              {(["ALL", "ACTIVE", "NEW", "VIP"] as const).map(tab => {
                const count = 
                  tab === "ALL" ? mergedCustomers.length :
                  tab === "ACTIVE" ? mergedCustomers.filter(c => c.ordersCount > 0).length :
                  tab === "NEW" ? stats.newCount :
                  mergedCustomers.filter(c => c.clv >= 1000).length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTableTab(tab)}
                    className={`pb-1 px-3 relative cursor-pointer tracking-wider font-bold transition-all ${
                      activeTableTab === tab
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D21B27]"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {tab === "ALL" ? "All Customers" :
                     tab === "ACTIVE" ? "Active" :
                     tab === "NEW" ? "New" : "VIP Collectors"}
                    <span className="ml-1 text-[8.5px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Right Tools: Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64 flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-2.5 py-1.5 focus-within:border-[#D21B27] transition-all">
                <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 flex-shrink-0" />
                <input 
                  type="text"
                  placeholder="Ctrl K to search clients..."
                  value={activeSearch}
                  onChange={e => dispatchSearchChange(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full font-light"
                />
              </div>

              <button className="p-2 border border-white/5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.01]">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Table Container */}
          <div className="border border-white/5 rounded-2xl bg-zinc-950/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]/40 text-zinc-500 text-[9px] uppercase tracking-widest font-mono">
                    <th className="py-4 px-6">CUSTOMER & AFFINITY</th>
                    <th className="py-4 px-4">CONTACT INFOMATION</th>
                    <th className="py-4 px-4">LOCATION</th>
                    <th className="py-4 px-4">TOTAL ORDERS</th>
                    <th className="py-4 px-4">TOTAL SPENT</th>
                    <th className="py-4 px-4">STATUS</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-[11.5px]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-neutral-500 font-light text-xs">
                        No customer profiles matching selected criteria or search term.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => (
                      <tr 
                        key={cust.email}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`hover:bg-white/[0.01]/60 transition-colors cursor-pointer group select-none ${
                          selectedCustomer?.email === cust.email ? "bg-white/[0.03]/80 border-l-[3px] border-[#D21B27]" : ""
                        }`}
                      >
                        {/* CUSTOMER PROFILE */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center text-[10.5px] font-extrabold ${cust.avatarBg || "bg-zinc-800"}`}>
                              {cust.initials}
                            </span>
                            <div>
                              <p className="font-semibold text-stone-100 group-hover:text-white transition-colors">{cust.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {cust.clv >= 2000 ? (
                                  <span className="text-[7.5px] uppercase font-mono tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1 py-0.2 rounded font-extrabold">VIP COLLECTOR</span>
                                ) : (
                                  <span className="text-[7.5px] uppercase font-mono tracking-widest bg-[#D21B27]/10 text-[#D21B27] border border-[#D21B27]/20 px-1 py-0.2 rounded font-bold">GUILD MEMBER</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="text-neutral-300 font-mono hover:text-[#D21B27] transition-colors block text-[10.5px]">{cust.email}</span>
                            <span className="text-neutral-500 text-[10px] font-mono block">{cust.phone}</span>
                          </div>
                        </td>

                        {/* GEOGRAPHIC AREA */}
                        <td className="py-4 px-4 text-neutral-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-600" />
                            <span>{cust.location}</span>
                          </div>
                        </td>

                        {/* TOTAL ORDERS */}
                        <td className="py-4 px-4 font-mono font-bold text-stone-200">
                          <div className="space-y-0.5">
                            <span className="text-[12px] text-white font-extrabold block">{cust.ordersCount}</span>
                            <span className="text-[8.5px] text-zinc-500 block font-normal">Last: {cust.joinedDate || "May 12, 2024"}</span>
                          </div>
                        </td>

                        {/* TOTAL SPENT */}
                        <td className="py-4 px-4 font-mono text-[#10b981] font-bold text-xs">
                          {cust.clv.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[8.5px] text-neutral-500 font-light">EGP</span>
                        </td>

                        {/* WORKFLOW STATUS */}
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 text-[8.5px] font-bold rounded border uppercase ${
                            cust.ordersCount > 1 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : cust.ordersCount === 1
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}>
                            {cust.ordersCount > 1 ? "Active Repeater" : cust.ordersCount === 1 ? "Acquired" : "Prospect"}
                          </span>
                        </td>

                        {/* ACTIONS CONTROLS */}
                        <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="p-1 px-2.5 border border-white/5 bg-white/5 hover:border-[#D21B27]/40 text-[10.5px] rounded-lg font-mono text-zinc-300 hover:text-white cursor-pointer"
                              title="Inspect Records"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleDeleteClick(cust.email, cust.name)}
                              className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-[#D21B27] transition-all cursor-pointer"
                              title="Delete Buyer Registry Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Visual Stats footer */}
            <div className="px-6 py-4 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0A0203]/40">
              <span className="text-[10px] font-mono text-neutral-500">
                Projected entries Cairo-Giza: Showing {filteredCustomers.length} of {mergedCustomers.length} registered profiles
              </span>

              <div className="flex gap-1.5 text-[10px] font-mono">
                <button disabled className="px-2.5 py-1 rounded border border-white/5 text-neutral-600 bg-white/[0.01] cursor-not-allowed">v Prev</button>
                <button className="px-2.5 py-1 rounded bg-[#D21B27] text-white font-bold">1</button>
                <button className="px-2.5 py-1 rounded border border-white/5 text-neutral-400 hover:text-white">2</button>
                <span className="text-zinc-650 py-1">...</span>
                <button className="px-2.5 py-1 rounded border border-white/5 text-neutral-400 hover:text-white">Next ^</button>
              </div>
            </div>

          </div>

        </div>

        {/* CUSTOMER DETAILED TELEMETRY (Right Column) */}
        <div className="border border-white/5 rounded-2xl bg-zinc-950/20 p-6 flex flex-col justify-between min-h-[520px] shadow-lg text-left" id="customer-identity-viewer">
          {selectedCustomer ? (
            <div className="space-y-6 text-left">
              
              {/* Profile Card Header Component */}
              <div className="flex justify-between items-start pb-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-serif font-extrabold shadow-sm ${selectedCustomer.avatarBg}`}>
                    {selectedCustomer.initials}
                  </span>
                  <div>
                    <h4 className="text-md font-serif text-white tracking-wider uppercase font-extrabold">{selectedCustomer.name}</h4>
                    <span className="text-[10.5px] text-[#C29F68] font-mono font-bold block mt-0.5">{selectedCustomer.joinedDate || "May 12, 2024"} · registry</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bio details list */}
              <div className="space-y-3.5 text-xs text-stone-200">
                <div className="flex items-center gap-2.5 py-1 px-3 border border-white/5 bg-zinc-950/50 rounded-xl">
                  <Mail className="w-3.5 h-3.5 text-[#D21B27]" />
                  <span className="font-mono text-[10.5px] truncate">{selectedCustomer.email}</span>
                </div>

                <div className="flex items-center gap-2.5 py-1 px-3 border border-white/5 bg-zinc-950/50 rounded-xl">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono text-[10.5px]">{selectedCustomer.phone || "+20 10 1234 5678"}</span>
                </div>

                <div className="flex items-center gap-2.5 py-1 px-3 border border-white/5 bg-zinc-950/50 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{selectedCustomer.location} region, Egypt</span>
                </div>
              </div>

              {/* CLV Metric Dashboard Boxes */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]/70">
                  <span className="text-[8px] uppercase font-mono text-zinc-500 font-bold block">CLIENT REVENUE</span>
                  <span className="text-md font-mono text-emerald-400 font-bold block mt-1">
                    {selectedCustomer.clv.toFixed(0)} <span className="text-[9px] font-normal text-zinc-500">EGP</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]/70">
                  <span className="text-[8px] uppercase font-mono text-zinc-500 font-bold block">TOTAL DISPATCHED</span>
                  <span className="text-md font-mono text-white font-bold block mt-1">
                    {selectedCustomer.ordersCount} times
                  </span>
                </div>
              </div>

              {/* Interactive Scent questionnaire Traits profile */}
              <div className="p-4 rounded-xl border border-[#D21B27]/10 bg-[#1F0D0F]/15 text-[11px] font-light space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#D21B27]" />
                  <span className="text-[8px] font-mono uppercase text-[#D21B27] font-bold">Sensory Affinity Vector</span>
                </div>
                <p className="text-white font-medium">Warm • Smoky • Leather Affinity</p>
                <p className="text-neutral-400 text-[10px] leading-relaxed font-light">
                  Highly responsive to Cairo Oud launch specials. Preferred concentration: Extrait de Parfum (Solid). Completed scent quiz on May 24.
                </p>
              </div>

              {/* Association checkout history logs */}
              <div>
                <span className="text-[8.5px] uppercase font-mono text-neutral-500 font-bold block mb-2">History of Completed Checkout logs</span>
                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-neutral-500 text-[10.5px] py-6 text-center border rounded-xl border-white/5 border-dashed">
                    No active invoice logs recorded for this registry profile.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {selectedCustomer.orders.map(order => (
                      <div key={order.id} className="p-2.5 border border-white/5 rounded-xl bg-white/[0.01] flex justify-between items-center text-[10.5px] font-light">
                        <div>
                          <span className="font-mono text-[#C29F68] font-bold block">{order.id}</span>
                          <span className="text-[9px] text-zinc-500 block">Shipped package Cairo</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-white block font-semibold">{order.total.toFixed(0)} EGP</span>
                          <span className="text-[8px] uppercase tracking-wider text-emerald-400 block pt-0.5 font-bold">✓ {order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500 font-light my-auto">
              <Users className="w-7 h-7 text-zinc-850 mb-4 animate-pulse text-[#D21B27]" />
              <p className="text-xs uppercase font-mono tracking-widest text-zinc-400">Collector Inspector</p>
              <p className="text-[11px] text-zinc-600 mt-2 max-w-xs leading-relaxed">
                Highlight any collector profile within the registered registry grid to inspect contact indexes, active phone data, associated invoice timelines, and scent affinities.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* DRAWING SLIDE MODAL: ADD CLIENT MANUALLY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#0e0c0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/[0.05] bg-[#0A0203]">
              <div>
                <h3 className="text-md font-serif text-white uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  ✦ Manually Create Collector Profile
                </h3>
                <p className="text-[10px] text-neutral-400 font-light mt-0.5">Hydrate Cairo Client Registry with offline checkout records.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-left">
              
              <div>
                <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karim Sabry"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-xl p-2.5 text-xs text-stone-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Registry Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. karim@sabry.com"
                    value={newCustEmail}
                    onChange={e => setNewCustEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-xl p-2.5 text-xs text-stone-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Phone Index</label>
                  <input
                    type="text"
                    placeholder="e.g. +20 10 9987 6543"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-xl p-2.5 text-xs text-stone-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Geographic Area</label>
                  <select
                    value={newCustLocation}
                    onChange={e => setNewCustLocation(e.target.value)}
                    className="w-full bg-[#0d0a09] border border-white/5 rounded-xl p-2.5 text-xs text-stone-200 outline-none focus:border-[#D21B27]"
                  >
                    <option value="Cairo">Cairo (Central)</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="Giza">Giza (West)</option>
                    <option value="El Gouna">El Gouna (Resort)</option>
                    <option value="Heliopolis">Heliopolis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Profile Affiliate Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP COLLECTOR, INFLUENCER"
                    value={newCustTags}
                    onChange={e => setNewCustTags(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-xl p-2.5 text-xs text-stone-200 outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-xl text-[10.5px] text-zinc-400 leading-relaxed font-light mt-2">
                <span className="text-[#D21B27] font-bold block uppercase mb-1 font-mono text-[8px]">Registry Note</span>
                Creating this profile manually registers them as a prospect collector with 0 lifetime checkouts. Checkout invoices can be linked via checking out item carts on the storefront.
              </div>

              {/* Footer CTA */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.04] justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-[#D21B27]/10"
                >
                  Confirm & Registry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
