import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api, type DispenseOrder, type DispenseItem } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import {
  ShoppingBag, Clock, CheckCircle, ChevronDown, ChevronUp,
  Loader2, Package, ExternalLink, AlertCircle, Undo2, RefreshCw,
  Search, X, CalendarDays,
} from "lucide-react";

type TabStatus = "pending,partial" | "completed";

const PAGE_SIZE = 25;
const today = () => new Date().toISOString().split("T")[0];

export function Dispensary() {
  const { doctorId } = useAuth();
  const [tab, setTab]           = useState<TabStatus>("pending,partial");
  const [orders, setOrders]     = useState<DispenseOrder[]>([]);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo]     = useState("");
  const offsetRef               = useRef(0);

  const load = useCallback(async (reset = true) => {
    const offset = reset ? 0 : offsetRef.current;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await api.dispense.list(doctorId, tab, {
        dateFrom, dateTo, limit: PAGE_SIZE, offset,
      });
      if (reset) {
        setOrders(res.orders);
        offsetRef.current = res.orders.length;
      } else {
        setOrders(prev => [...prev, ...res.orders]);
        offsetRef.current = offset + res.orders.length;
      }
      setTotal(res.total);
      setHasMore(res.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }, [doctorId, tab, dateFrom, dateTo]);

  useEffect(() => { load(true); }, [load]);

  // Client-side search on the already-fetched (date-bounded) set
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o => {
      const name   = (o.patients?.name || o.patient_name || "").toLowerCase();
      const code   = (o.patients?.patient_code || "").toLowerCase();
      const mobile = (o.patients?.mobile || "").toLowerCase();
      return name.includes(q) || code.includes(q) || mobile.includes(q);
    });
  }, [orders, search]);

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const partialCount = orders.filter(o => o.status === "partial").length;
  const hasDateFilter = dateFrom !== today() || dateTo;
  const hasFilters    = search || hasDateFilter;

  return (
    <div className="min-h-full bg-slate-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }} className="text-slate-800">
              Dispensary
            </h1>
            <p className="text-[12px] text-slate-400">Dispense medicines to patients from clinic stock</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("pending,partial")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
              tab === "pending,partial"
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-violet-200"
            }`}
          >
            <Clock size={14} />
            Pending / Partial
            {(pendingCount + partialCount) > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === "pending,partial" ? "bg-white/30 text-white" : "bg-violet-100 text-violet-700"
              }`}>
                {pendingCount + partialCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
              tab === "completed"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200"
            }`}
          >
            <CheckCircle size={14} />
            Completed
          </button>
        </div>

        {/* Search + Date filters */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, mobile or patient code…"
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            />
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            />
            <span className="text-[12px] text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            />
          </div>
          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setDateFrom(today()); setDateTo(""); }}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-violet-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-slate-400" />
            </div>
            {hasFilters ? (
              <>
                <p className="text-[14px] font-semibold text-slate-600">No orders match your search</p>
                <p className="text-[12px] text-slate-400 mt-1">Try a different name, mobile, or date range</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-slate-600">No {tab === "completed" ? "completed" : "pending"} dispense orders</p>
                <p className="text-[12px] text-slate-400 mt-1">
                  {tab === "pending,partial"
                    ? "Orders appear here when prescriptions are saved"
                    : "Completed dispense orders will appear here"}
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-[12px] text-slate-400 px-1">
              {search
                ? `${filteredOrders.length} match${filteredOrders.length !== 1 ? "es" : ""} · ${orders.length} loaded of ${total} total`
                : `${orders.length} of ${total} order${total !== 1 ? "s" : ""}`}
            </p>
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <DispenseOrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expanded === order.id}
                  onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
                  onDispensed={() => load(true)}
                />
              ))}
            </div>
            {hasMore && !search && (
              <button
                onClick={() => load(false)}
                disabled={loadingMore}
                className="w-full py-3 text-[13px] font-semibold text-violet-600 border border-violet-200 bg-white rounded-2xl hover:bg-violet-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingMore
                  ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
                  : `Load more (${total - orders.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Order Card ──────────────────────────────────────────────────────────────

function DispenseOrderCard({
  order,
  isExpanded,
  onToggle,
  onDispensed,
}: {
  order: DispenseOrder;
  isExpanded: boolean;
  onToggle: () => void;
  onDispensed: () => void;
}) {
  const patientName = order.patients?.name || order.patient_name || "Walk-in patient";
  const patientCode = order.patients?.patient_code;
  const items       = order.dispense_items || [];
  const pendingItems = items.filter(i => i.status === "pending").length;
  const date = new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const statusColor =
    order.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    order.status === "partial"   ? "bg-amber-100 text-amber-700 border-amber-200" :
                                   "bg-violet-100 text-violet-700 border-violet-200";
  const statusLabel =
    order.status === "completed" ? "Completed" :
    order.status === "partial"   ? "Partial" : "Pending";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold text-[15px]">
          {patientName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-[14px]">{patientName}</span>
            {patientCode && (
              <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{patientCode}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400">{date}</span>
            <span className="text-[11px] text-slate-400">{items.length} medicine{items.length !== 1 ? "s" : ""}</span>
            {pendingItems > 0 && order.status !== "completed" && (
              <span className="text-[11px] text-violet-600 font-medium">{pendingItems} pending</span>
            )}
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
        {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {/* Expanded dispense panel */}
      {isExpanded && (
        <DispensePanel
          order={order}
          onDispensed={onDispensed}
        />
      )}
    </div>
  );
}

// ─── Processed Item Row (with Return) ────────────────────────────────────────

function ProcessedItemRow({
  item,
  orderId,
  onReturned,
}: {
  item: DispenseItem;
  orderId: string;
  onReturned: () => void;
}) {
  const [returning, setReturning]   = useState(false);
  const [returnQty, setReturnQty]   = useState(item.qty_dispensed);
  const [reopening, setReopening]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const remaining = item.qty_prescribed - item.qty_dispensed;
  const hasRemaining = remaining > 0;

  async function confirmReopen() {
    setReopening(true);
    setError("");
    try {
      await api.dispense.reopenItem(orderId, item.id);
      onReturned(); // refreshes the whole list — order moves to Pending/Partial tab
    } catch (e: any) {
      setError(e?.message || "Failed to reopen");
      setReopening(false);
    }
  }

  async function confirmReturn() {
    if (returnQty <= 0) return;
    setSaving(true);
    setError("");
    try {
      await api.dispense.returnItem(orderId, item.id, returnQty);
      onReturned();
    } catch (e: any) {
      setError(e?.message || "Return failed");
      setSaving(false);
    }
  }

  // Pure external — nothing dispensed from clinic at all
  if (item.status === "external" && item.qty_dispensed === 0) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-slate-50 border-slate-100">
        <ExternalLink size={15} className="text-slate-400 flex-shrink-0" />
        <span className="text-[13px] font-medium text-slate-700 flex-1">{item.medicine_name}</span>
        {item.dosage && <span className="text-[11px] text-slate-400">{item.dosage}</span>}
        <span className="text-[11px] text-slate-500">Bought outside</span>
      </div>
    );
  }

  // Partial — some from clinic, rest from outside
  const isPartialExternal = item.status === "partial" || (item.status === "external" && item.qty_dispensed > 0);
  const borderColor = returning ? "border-amber-200 bg-amber-50/40"
    : isPartialExternal ? "border-blue-100 bg-blue-50/30"
    : "border-emerald-100 bg-emerald-50/40";

  return (
    <div className={`rounded-xl border transition-all ${borderColor}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {isPartialExternal
          ? <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">½</span>
            </div>
          : <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
        }
        <span className="text-[13px] font-medium text-slate-700 flex-1">{item.medicine_name}</span>
        {item.dosage && <span className="text-[11px] text-slate-400">{item.dosage}</span>}
        {isPartialExternal ? (
          <span className="text-[12px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            {item.qty_dispensed} / {item.qty_prescribed} from clinic · rest outside
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {item.qty_dispensed} / {item.qty_prescribed} dispensed
          </span>
        )}
        {!returning && (
          <div className="flex items-center gap-1.5 ml-1">
            {hasRemaining && (
              <button
                onClick={confirmReopen}
                disabled={reopening}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-violet-700 bg-violet-100 border border-violet-200 rounded-lg hover:bg-violet-200 transition-colors disabled:opacity-50"
              >
                {reopening
                  ? <Loader2 size={11} className="animate-spin" />
                  : <RefreshCw size={11} />
                }
                Dispense {remaining} more
              </button>
            )}
            <button
              onClick={() => { setReturning(true); setReturnQty(item.qty_dispensed); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <Undo2 size={11} /> Return
            </button>
          </div>
        )}
        {error && <span className="text-[11px] text-red-500 ml-1">{error}</span>}
      </div>

      {/* Return inline panel */}
      {returning && (
        <div className="flex items-center gap-3 px-3 pb-3 border-t border-amber-100 pt-2.5">
          <Undo2 size={13} className="text-amber-600 flex-shrink-0" />
          <span className="text-[12px] text-amber-700 font-medium">Return qty to stock:</span>
          <input
            type="number"
            min={0.5}
            max={item.qty_dispensed}
            step={0.5}
            value={returnQty}
            onChange={e => setReturnQty(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1.5 text-[13px] font-semibold border border-amber-300 rounded-lg text-center bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <span className="text-[11px] text-slate-400">units</span>
          {error && <span className="text-[11px] text-red-500 ml-1">{error}</span>}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { setReturning(false); setError(""); }}
              className="px-3 py-1.5 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmReturn}
              disabled={saving || returnQty <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
              {saving ? "Returning…" : "Confirm Return"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Dispense Panel ───────────────────────────────────────────────────────────

interface ItemState {
  action: "dispense" | "external" | "pending";
  qty: number;
}

function DispensePanel({ order, onDispensed }: { order: DispenseOrder; onDispensed: () => void }) {
  const items = order.dispense_items || [];

  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() => {
    const init: Record<string, ItemState> = {};
    for (const item of items) {
      const remaining = Math.max(0, item.qty_prescribed - item.qty_dispensed);
      init[item.id] = {
        action: item.status === "external" ? "external" : item.status === "dispensed" ? "dispense" : "pending",
        qty: remaining > 0 ? remaining : item.qty_prescribed,
      };
    }
    return init;
  });

  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const pendingItems = items.filter(i => i.status === "pending");
  const hasAction = pendingItems.some(i => itemStates[i.id]?.action !== "pending");

  async function handleConfirm() {
    const actions = pendingItems
      .map(item => ({
        item_id: item.id,
        action:  itemStates[item.id]?.action ?? "pending",
        qty:     itemStates[item.id]?.qty ?? 0,
      }))
      .filter(a => a.action !== "pending");

    if (actions.length === 0) return;
    setSaving(true);
    setError("");
    try {
      await api.dispense.process(order.id, actions);
      setSuccess(true);
      setTimeout(() => { onDispensed(); }, 1200);
    } catch (e: any) {
      setError(e?.message || "Failed to process dispense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">

      {/* Already-done items — with qty/total and Return option */}
      {items.filter(i => i.status !== "pending").length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Already processed</p>
          {items.filter(i => i.status !== "pending").map(item => (
            <ProcessedItemRow
              key={item.id}
              item={item}
              orderId={order.id}
              onReturned={onDispensed}
            />
          ))}
        </div>
      )}

      {/* Pending items — actionable */}
      {pendingItems.length > 0 && (
        <div className="space-y-2">
          {items.filter(i => i.status !== "pending").length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Remaining medicines</p>
          )}
          {pendingItems.map(item => {
            const state = itemStates[item.id] ?? { action: "pending", qty: item.qty_prescribed };
            const remaining = item.qty_prescribed - item.qty_dispensed;

            return (
              <div key={item.id} className={`rounded-xl border transition-all ${
                state.action === "dispense"  ? "border-emerald-200 bg-emerald-50/40" :
                state.action === "external"  ? "border-slate-200 bg-slate-50/40" :
                                               "border-slate-200 bg-white"
              }`}>
                {/* Medicine name + dosage */}
                <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Package size={13} className="text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-semibold text-slate-800">{item.medicine_name}</span>
                    {item.dosage && <span className="ml-2 text-[11px] text-slate-400">{item.dosage}</span>}
                  </div>
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Rx: {item.qty_prescribed} · Balance: {remaining}
                  </span>
                </div>

                {/* Action selector */}
                <div className="flex items-center gap-2 px-3 pb-3">
                  <button
                    onClick={() => setItemStates(s => ({ ...s, [item.id]: { ...s[item.id], action: "dispense" } }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                      state.action === "dispense"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <CheckCircle size={13} /> From clinic
                  </button>
                  <button
                    onClick={() => setItemStates(s => ({ ...s, [item.id]: { ...s[item.id], action: "external" } }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                      state.action === "external"
                        ? "bg-slate-600 text-white border-slate-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <ExternalLink size={13} /> Buying outside
                  </button>
                  <button
                    onClick={() => setItemStates(s => ({ ...s, [item.id]: { ...s[item.id], action: "pending" } }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                      state.action === "pending"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-white text-slate-400 border-slate-200 hover:border-amber-200"
                    }`}
                  >
                    <Clock size={13} /> Later
                  </button>

                  {/* Qty input — only when dispensing from clinic */}
                  {state.action === "dispense" && (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min={0.5}
                        max={remaining}
                        step={0.5}
                        value={state.qty}
                        onChange={e => setItemStates(s => ({
                          ...s,
                          [item.id]: { ...s[item.id], qty: parseFloat(e.target.value) || 0 },
                        }))}
                        className="w-16 px-2 py-1.5 text-[13px] font-semibold border border-emerald-300 rounded-lg text-center bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                      <span className="text-[11px] text-slate-400">units</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {pendingItems.length > 0 && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          {error && (
            <div className="flex items-center gap-1.5 text-[12px] text-red-600">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-semibold">
              <CheckCircle size={13} /> Saved!
            </div>
          )}
          <div className="flex-1" />
          {!hasAction && (
            <p className="text-[11px] text-slate-400">Select an action for at least one medicine</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!hasAction || saving || success}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-[13px] font-bold px-5 py-2 rounded-xl transition-all active:scale-95"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? "Processing…" : "Confirm Dispense"}
          </button>
        </div>
      )}

      {pendingItems.length === 0 && (
        <div className="flex items-center gap-2 text-[13px] text-emerald-600 font-semibold py-2">
          <CheckCircle size={16} /> All medicines processed for this prescription
        </div>
      )}
    </div>
  );
}
