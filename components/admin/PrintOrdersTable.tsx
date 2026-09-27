'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatEditorialDate } from '@/lib/date';
import { Search, Printer, ArrowRight, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { PrintOrderSlideOver } from './PrintOrderSlideOver';

export interface PrintOrderItem {
  _id: string; // PrintSelection ID
  galleryId: string;
  coupleNames: string;
  weddingDate: string;
  clientEmail: string;
  submittedAt: string;
  mediaCount: number;
  notesCount: number;
}

interface PrintOrdersTableProps {
  orders: PrintOrderItem[];
}

export const PrintOrdersTable: React.FC<PrintOrdersTableProps> = ({ orders }) => {
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase();
      return (
        order.coupleNames.toLowerCase().includes(q) ||
        order.clientEmail.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const totalPrintsAcrossOrders = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.mediaCount, 0);
  }, [orders]);

  const totalNotesAcrossOrders = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.notesCount, 0);
  }, [orders]);

  return (
    <div className="space-y-4 text-left">
      {/* Search & Metrics Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#131918] p-4 rounded-[14px] border border-white/[0.08] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by couple or client email..."
            className="w-full bg-[#182220] text-xs font-sans text-white placeholder:text-white/30 pl-9 pr-3 py-2 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none rounded-[8px] transition-all"
          />
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="bg-[#182220] text-[#F4F3ED] px-3 py-1.5 rounded-[8px] border border-white/10">
            <strong className="text-white">{orders.length}</strong> {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
          <span className="bg-[#182220] text-teal px-3 py-1.5 rounded-[8px] border border-teal/20">
            <strong>{totalPrintsAcrossOrders}</strong> Prints Queued
          </span>
          <span className="bg-[#182220] text-amber-400 px-3 py-1.5 rounded-[8px] border border-amber-500/30">
            <strong>{totalNotesAcrossOrders}</strong> Custom Notes
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#131918] border border-white/[0.08] rounded-[14px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#0E1413] border-b border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#9EABA2]">
                <th className="py-3.5 px-4 font-medium">Couple &amp; Contact</th>
                <th className="py-3.5 px-4 font-medium">Wedding Date</th>
                <th className="py-3.5 px-4 font-medium">Submitted</th>
                <th className="py-3.5 px-4 font-medium text-center">Selected Prints</th>
                <th className="py-3.5 px-4 font-medium text-center">Retouch Notes</th>
                <th className="py-3.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
                      <Printer className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
                      {search ? 'No orders match your search' : 'No submitted print orders yet'}
                    </h3>
                    <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
                      When couples submit and lock their 50-photo archival print curation in the client portal, their orders will appear here.
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#182220] hover:bg-[#1E2B28] text-teal border border-teal/30 text-xs font-mono transition-colors cursor-pointer"
                      >
                        Reset search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-[#18201E] transition-colors group"
                  >
                    {/* Couple & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F4F3ED] text-sm group-hover:text-teal transition-colors">
                        <Link
                          href={`/admin/prints/${order._id}`}
                          className="hover:underline"
                        >
                          {order.coupleNames}
                        </Link>
                      </div>
                      <div className="text-[11px] text-[#9EABA2] font-mono mt-0.5">
                        {order.clientEmail}
                      </div>
                    </td>

                    {/* Wedding Date */}
                    <td className="py-3.5 px-4 text-[#9EABA2] font-mono text-[11px]">
                      {order.weddingDate ? formatEditorialDate(order.weddingDate) : '—'}
                    </td>

                    {/* Submitted Timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-[#F4F3ED]">
                        {order.submittedAt ? formatEditorialDate(order.submittedAt) : '—'}
                      </div>
                      <div className="text-[10px] text-teal flex items-center gap-1 font-sans mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-teal" />
                        <span>Locked &amp; Ready</span>
                      </div>
                    </td>

                    {/* Selected Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-medium px-2.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20 text-xs">
                        {order.mediaCount} / 50
                      </span>
                    </td>

                    {/* Notes Count */}
                    <td className="py-3.5 px-4 text-center">
                      {order.notesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>{order.notesCount} {order.notesCount === 1 ? 'note' : 'notes'}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/30 font-mono">None</span>
                      )}
                    </td>

                    {/* Action - Opens Right Slide-Over Panel */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] rounded-[8px] text-xs font-semibold shadow-sm hover:brightness-105 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Slide-Over Panel */}
      <PrintOrderSlideOver
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};

export default PrintOrdersTable;
