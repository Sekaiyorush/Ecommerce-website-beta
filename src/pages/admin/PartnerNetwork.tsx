import { useState } from 'react';
import { type Partner } from '@/data/products';
import { useDatabase } from '@/context/DatabaseContext';
import { formatTHB } from '@/lib/formatPrice';
import {
  Search,
  Users,
  Network,
  Percent,
  User
} from 'lucide-react';

interface NetworkNode {
  partner: Partner;
  level: number;
  children: NetworkNode[];
}

export function PartnerNetwork() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { db } = useDatabase();
  const partners = db.partners;

  // Build network tree
  const buildNetworkTree = (partnerId: string | null, level: number = 0): NetworkNode[] => {
    const directPartners = partners.filter(p =>
      partnerId ? p.referredBy === partnerId : !p.referredBy
    );

    return directPartners.map(p => ({
      partner: p,
      level,
      children: buildNetworkTree(p.id, level + 1)
    }));
  };

  const networkTree = buildNetworkTree(null);

  // Calculate network stats
  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.status === 'active').length;
  const totalNetworkPurchases = partners.reduce((sum, p) => sum + p.totalPurchases, 0);

  // Find top performers by purchase volume
  const topPerformers = [...partners]
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Recursive component for network tree
  const NetworkTreeNode = ({ node }: { node: NetworkNode }) => {
    const hasChildren = node.children.length > 0;

    return (
      <div className="relative">
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedPartner?.id === node.partner.id
              ? 'bg-slate-900 text-white'
              : 'bg-white hover:bg-slate-50 border border-slate-200'
            }`}
          onClick={() => setSelectedPartner(node.partner)}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPartner?.id === node.partner.id ? 'bg-white/20' : 'bg-slate-100'
            }`}>
            <User className={`h-5 w-5 ${selectedPartner?.id === node.partner.id ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${selectedPartner?.id === node.partner.id ? 'text-white' : 'text-slate-900'}`}>
              {node.partner.name || node.partner.email}
            </p>
            <p className={`text-sm truncate ${selectedPartner?.id === node.partner.id ? 'text-white/70' : 'text-slate-500'}`}>
              {node.partner.company || ''}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-2 py-0.5 rounded-full text-xs ${selectedPartner?.id === node.partner.id
                ? 'bg-white/20 text-white'
                : getStatusColor(node.partner.status)
              }`}>
              {node.partner.discountRate}% off
            </span>
            <p className={`text-xs mt-1 ${selectedPartner?.id === node.partner.id ? 'text-white/70' : 'text-slate-400'}`}>
              {node.children.length} referrals
            </p>
          </div>
        </div>

        {hasChildren && (
          <div className="ml-6 mt-2 space-y-2 relative">
            <div className="absolute left-0 top-0 bottom-4 w-px bg-slate-200" />
            {node.children.map((child) => (
              <div key={child.partner.id} className="relative">
                <div className="absolute -left-6 top-5 w-4 h-px bg-slate-200" />
                <NetworkTreeNode node={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Partner Network</h2>
        <p className="text-slate-500">Visualize and manage your partner hierarchy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">Total Partners</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalPartners}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Network className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-slate-500">Active</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-600">{activePartners}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-slate-500">Total Purchase Volume</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatTHB(totalNetworkPurchases)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Tree */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Network Hierarchy</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>
          <div className="p-5 max-h-[600px] overflow-auto">
            <div className="space-y-2">
              {networkTree.map((node) => (
                <NetworkTreeNode key={node.partner.id} node={node} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Partner Details */}
          {selectedPartner ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Partner Details</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedPartner.name || selectedPartner.email}</p>
                    <p className="text-sm text-slate-500">{selectedPartner.company || ''}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-900">{selectedPartner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-900">{selectedPartner.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-medium text-indigo-600">{selectedPartner.discountRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedPartner.status)}`}>
                      {selectedPartner.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joined</span>
                    <span className="text-slate-900">{selectedPartner.joinedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Purchases</span>
                    <span className="text-slate-900 font-medium">{formatTHB(selectedPartner.totalPurchases)}</span>
                  </div>
                </div>

                {selectedPartner.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{selectedPartner.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <Network className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select a partner to view details</p>
            </div>
          )}

          {/* Top Performers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Top Volume Partners</h3>
            <div className="space-y-3">
              {topPerformers.map((partner, idx) => (
                <div key={partner.id} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{partner.name || partner.email}</p>
                    <p className="text-xs text-slate-500">{partner.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatTHB(partner.totalPurchases)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
