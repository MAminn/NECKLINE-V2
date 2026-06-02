import { useState, FormEvent } from "react";
import { 
  Search, Eye, Edit, Trash2, CheckCircle2, Truck, AlertCircle, Calendar, 
  MapPin, User, DollarSign, Tag, ExternalLink, RefreshCw, X
} from "lucide-react";

interface TimelineEvent {
  status: string;
  date: string;
  description: string;
}

interface Order {
  id: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string;
  location: string;
  itemsSummary: string;
  itemCount: number;
  totalPrice: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  placedAt: string;
  trackingNumber?: string;
  timeline?: TimelineEvent[];
}

interface AdminOrdersTabProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, payload: { status?: string; trackingNumber?: string }) => void;
  onDeleteOrder: (orderId: string) => void;
  onRefresh: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (val: string) => void;
}

export default function AdminOrdersTab({ 
  orders, 
  onUpdateOrder, 
  onDeleteOrder, 
  onRefresh,
  globalSearchQuery,
  onGlobalSearchChange
}: AdminOrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeSearch = globalSearchQuery !== undefined ? globalSearchQuery : searchQuery;
  
  const dispatchSearchChange = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setSearchQuery(val);
    }
  };

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  // Filter logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(activeSearch.toLowerCase()) || 
                          o.id.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          (o.itemsSummary && o.itemsSummary.toLowerCase().includes(activeSearch.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    await onUpdateOrder(orderId, { status: newStatus });
    
    // Update active detailed view order if opened
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => {
        if (!prev) return null;
        const updatedTimeline = [...(prev.timeline || [])];
        updatedTimeline.push({
          status: newStatus,
          date: new Date().toISOString(),
          description: `Order upgraded to status [${newStatus}] by admin`
        });
        return {
          ...prev,
          status: newStatus as any,
          timeline: updatedTimeline
        };
      });
    }
    setIsUpdating(false);
  };

  const handleTrackingSubmit = async (e: FormEvent, orderId: string) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdateOrder(orderId, { trackingNumber: trackingInput });
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => {
        if (!prev) return null;
        return { ...prev, trackingNumber: trackingInput };
      });
    }
    setTrackingInput("");
    setIsUpdating(false);
  };

  return (
    <div className="p-8 space-y-6" id="orders-tab-wrapper">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Aura Fulfilment Chamber</h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Review, prepare, ship, and tracking sensory perfume packages Cairo & Alexandria wide.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-auto h-10 px-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-mono text-zinc-300 flex items-center gap-2 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders Table Container (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-950/40">
            <div className="relative w-full sm:max-w-xs flex items-center bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 focus-within:border-[#D21B27] transition-all">
              <Search className="w-4 h-4 text-neutral-500 mr-2" />
              <input 
                type="text"
                placeholder="Search orders..."
                value={activeSearch}
                onChange={e => dispatchSearchChange(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none w-full"
              />
            </div>

            <div className="flex gap-2">
              {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                    statusFilter === status
                      ? "bg-[#D21B27] text-white"
                      : "border border-white/5 bg-white/[0.01]/60 text-zinc-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-white/5 rounded-2xl bg-zinc-950/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]/30 text-zinc-500 text-[9px] uppercase tracking-widest font-mono">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-4">Client</th>
                    <th className="py-4 px-4">Items Summary</th>
                    <th className="py-4 px-4">Total Price</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-neutral-400 font-light text-xs">
                        No orders currently match filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr 
                        key={order.id}
                        className={`hover:bg-white/[0.01]/60 transition-colors text-[11.5px] cursor-pointer ${
                          selectedOrder?.id === order.id ? "bg-white/[0.03]/80 border-l-[3px] border-[#D21B27]" : ""
                        }`}
                        onClick={() => {
                          setSelectedOrder(order);
                          setTrackingInput(order.trackingNumber || "");
                        }}
                      >
                        <td className="py-4 px-6 font-mono font-bold tracking-widest text-[#C29F68]">
                          {order.id}
                        </td>
                        <td className="py-4 px-4 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${order.customerAvatarBg || "bg-zinc-850"}`}>
                              {order.customerInitials || "AN"}
                            </span>
                            <span className="font-semibold text-white block">{order.customerName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-zinc-300 font-light max-w-[150px] truncate" title={order.itemsSummary}>
                          {order.itemsSummary}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-white">
                          {order.totalPrice.toFixed(2)} EGP
                        </td>
                        <td className="py-4 px-4 text-neutral-400">
                          {order.location}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 text-[8.5px] font-bold rounded border uppercase ${
                            order.status === "DELIVERED" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "SHIPPED"
                              ? "bg-sky-500/10 text-sky-450 border-sky-500/20"
                              : order.status === "PROCESSING"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setTrackingInput(order.trackingNumber || "");
                              }}
                              className="p-1 px-2 border border-white/5 rounded-lg text-[10px] bg-white/5 text-zinc-300 hover:text-white hover:border-[#D21B27]/40"
                              title="Inspect Full Details"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                if (true) {
                                  onDeleteOrder(order.id);
                                  if (selectedOrder?.id === order.id) setSelectedOrder(null);
                                }
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Delete Order Record"
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
          </div>

        </div>

        {/* Dynamic Details Sidebar panel (Right 1 col) */}
        <div className="border border-white/5 rounded-2xl bg-zinc-950/20 p-6 flex flex-col justify-between min-h-[500px]" id="orders-details-sidebar">
          {selectedOrder ? (
            <div className="space-y-6 text-left">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500">Selected Order</span>
                  <p className="text-xl font-mono text-[#C29F68] font-bold">{selectedOrder.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="p-4 rounded-xl bg-white/[0.01]/70 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-light">Workflow Status</span>
                  <span className="text-[10px] font-bold text-white uppercase">{selectedOrder.status}</span>
                </div>

                {/* Status Transitions buttons dropdown-style */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
                  {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map(st => (
                    <button
                      key={st}
                      disabled={isUpdating || selectedOrder.status === st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`py-1 rounded text-[9px] tracking-wider font-bold uppercase transition-all shadow-sm ${
                        selectedOrder.status === st
                          ? "bg-white/10 text-white cursor-default"
                          : "bg-black/40 hover:bg-[#D21B27] text-stone-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products items summary */}
              <div>
                <dt className="text-[8.5px] uppercase font-mono text-neutral-500 font-bold mb-2">Scent Inventory Items</dt>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  <div className="p-3 rounded-lg border border-white/5 bg-black/[0.04] text-[11.5px] font-light text-zinc-300">
                    <p className="font-semibold text-white">{selectedOrder.itemsSummary}</p>
                    <p className="text-[10.5px] text-[#C29F68] font-mono mt-1">{selectedOrder.itemCount} items purchased</p>
                  </div>
                </div>
              </div>

              {/* Tracking number update form */}
              <form onSubmit={e => handleTrackingSubmit(e, selectedOrder.id)} className="space-y-2">
                <label className="block text-[8.5px] font-mono uppercase text-neutral-500 font-bold">Courier Shipping & tracking</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRK-EGY-77610"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    className="flex-1 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-lg p-2 text-xs text-stone-200 outline-none"
                  />
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="px-3 rounded-lg bg-[#D21B27] text-white hover:bg-[#B0151E] text-[10px] tracking-widest font-bold uppercase cursor-pointer"
                  >
                    Set
                  </button>
                </div>
                {selectedOrder.trackingNumber && (
                  <p className="text-[10px] text-emerald-400 font-mono">
                    ✓ Active tracking: <span className="font-bold underline">{selectedOrder.trackingNumber}</span>
                  </p>
                )}
              </form>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-[11px] font-light leading-relaxed pt-3 border-t border-white/[0.04]">
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono uppercase">Client Name</span>
                  <span className="text-stone-200 block font-semibold">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono uppercase">Location</span>
                  <span className="text-stone-200 block">{selectedOrder.location}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono uppercase">Total Paid</span>
                  <span className="text-white block font-mono font-bold">{selectedOrder.totalPrice.toFixed(2)} EGP</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono uppercase">Order Timestamp</span>
                  <span className="text-zinc-400 block font-mono text-[10px]">{selectedOrder.placedAt}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500 font-light">
              <Eye className="w-8 h-8 text-zinc-700 mb-4 animate-pulse" />
              <p className="text-xs uppercase font-mono tracking-widest">Aura Inspector</p>
              <p className="text-[11px] text-zinc-600 mt-2 max-w-xs">
                Click on any sensory order queue item to inspect full client particulars, manage fulfilment cycles, issue tracking ID updates, and view history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
