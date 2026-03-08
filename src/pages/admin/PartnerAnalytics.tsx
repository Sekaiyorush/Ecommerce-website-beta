import { useState } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { formatTHB } from '@/lib/formatPrice';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  BarChart3,
  Target,
  UserPlus
} from 'lucide-react';

interface PartnerPerformance {
  id: string;
  name: string;
  email: string;
  company: string;
  discountRate: number;
  totalPurchases: number;
  networkSize: number;
  customerSignups: number;
  conversionRate: number;
  growth: number;
  status: string;
}

export function PartnerAnalytics() {
  const { db } = useDatabase();
  const { partners, orders, customers, invitationCodes } = db;
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sortBy, setSortBy] = useState<'revenue' | 'network' | 'growth'>('revenue');

  // Calculate partner performance metrics
  const calculatePerformance = (): PartnerPerformance[] => {
    return partners.map(partner => {
      const partnerOrders = orders.filter(o => o.partnerId === partner.id);
      const totalPurchases = partnerOrders.reduce((sum, o) => sum + o.total, 0);

      // Get network size (direct referrals)
      const networkSize = partners.filter(p => p.referredBy === partner.id).length;

      // Get customer signups from partner's invitation codes
      const partnerCodes = invitationCodes.filter(c => c.partnerId === partner.id);
      const customerSignups = partnerCodes.reduce((sum, c) => sum + c.usedCount, 0);

      // Calculate conversion rate (customers who made purchases / total signups)
      const partnerCustomers = customers.filter(c =>
        partnerCodes.some(code => code.code === c.invitationCode)
      );
      const customersWithOrders = partnerCustomers.filter(c => c.totalOrders > 0).length;
      const conversionRate = customerSignups > 0
        ? Math.round((customersWithOrders / customerSignups) * 100)
        : 0;

      // Calculate growth based on current vs previous period
      let growth = 0;
      if (partnerOrders.length > 0) {
        const _now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const currentPeriodStart = new Date(_now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

        const currentPeriodOrders = partnerOrders.filter(o => new Date(o.createdAt) >= currentPeriodStart);
        const prevPeriodOrders = partnerOrders.filter(o => new Date(o.createdAt) >= prevPeriodStart && new Date(o.createdAt) < currentPeriodStart);

        const currentRev = currentPeriodOrders.reduce((sum, o) => sum + o.total, 0);
        const prevRev = prevPeriodOrders.reduce((sum, o) => sum + o.total, 0);

        if (prevRev > 0) {
          growth = Math.round(((currentRev - prevRev) / prevRev) * 100);
        } else if (currentRev > 0) {
          growth = 100;
        }
      }

      return {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        company: partner.company,
        discountRate: partner.discountRate,
        totalPurchases,
        networkSize,
        customerSignups,
        conversionRate,
        growth,
        status: partner.status,
      };
    });
  };

  const performanceData = calculatePerformance();

  // Sort data
  const sortedData = [...performanceData].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return b.totalPurchases - a.totalPurchases;
      case 'network': return b.networkSize - a.networkSize;
      case 'growth': return b.growth - a.growth;
      default: return 0;
    }
  });

  // Top performers
  const topPerformers = sortedData.slice(0, 5);

  // Summary stats
  const totalPartnerRevenue = performanceData.reduce((sum, p) => sum + p.totalPurchases, 0);
  const totalNetworkSize = performanceData.reduce((sum, p) => sum + p.networkSize, 0);
  const totalCustomerSignups = performanceData.reduce((sum, p) => sum + p.customerSignups, 0);
  const avgConversionRate = performanceData.length > 0
    ? Math.round(performanceData.reduce((sum, p) => sum + p.conversionRate, 0) / performanceData.length)
    : 0;

  // Growth trend
  const growingPartners = performanceData.filter(p => p.growth > 0).length;
  const decliningPartners = performanceData.filter(p => p.growth < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Partner Analytics</h2>
          <p className="text-slate-500">Performance metrics and insights for your partner network</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-slate-500">Partner Revenue</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatTHB(totalPartnerRevenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-slate-500">Network Size</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalNetworkSize}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <UserPlus className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-slate-500">Customer Signups</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalCustomerSignups}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-slate-500">Avg Conversion</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{avgConversionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">Industry avg: 15%</p>
        </div>
      </div>

      {/* Growth Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-700">Growing Partners</p>
              <p className="text-2xl font-semibold text-emerald-900">{growingPartners}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700">Stable Partners</p>
              <p className="text-2xl font-semibold text-amber-900">
                {performanceData.length - growingPartners - decliningPartners}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700">Declining Partners</p>
              <p className="text-2xl font-semibold text-red-900">{decliningPartners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Top Performers</h3>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'revenue' | 'network' | 'growth')}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg"
            >
              <option value="revenue">By Revenue</option>
              <option value="network">By Network Size</option>
              <option value="growth">By Growth</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {topPerformers.map((partner, index) => (
            <div key={partner.id} className="p-5 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                  }`}>
                  {index + 1}
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">{(partner.name || partner.email || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{partner.name || partner.email}</p>
                  <p className="text-sm text-slate-500">{partner.company || ''}</p>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="font-semibold text-slate-900">{formatTHB(partner.totalPurchases)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Network</p>
                  <p className="font-semibold text-slate-900">{partner.networkSize}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Growth</p>
                  <div className={`flex items-center justify-end space-x-1 ${partner.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {partner.growth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{Math.abs(partner.growth)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">All Partners Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Partner</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Discount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Purchases</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Network</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Signups</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Conversion</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-sm">{(partner.name || partner.email || '?').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{partner.name || partner.email}</p>
                        <p className="text-xs text-slate-500">{partner.company || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {partner.discountRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">
                    {formatTHB(partner.totalPurchases)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {partner.networkSize}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {partner.customerSignups}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${partner.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-sm">{partner.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${partner.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      partner.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {partner.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
