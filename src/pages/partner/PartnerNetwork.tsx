import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { generateInvitationCode, type InvitationCode } from '@/data/invitations';
import { formatTHB } from '@/lib/formatPrice';
import {
  Users,
  Plus,
  Copy,
  Check,
  X,
  TrendingUp,
  UserPlus,
  DollarSign,
  Edit2,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';
import { SEO } from '@/components/SEO';

interface DownlineMember {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'partner';
  joinedAt: string;
  totalSpent?: number;
  discountRate?: number;
  status: string;
}

export function PartnerNetwork() {
  const { user } = useAuth();
  const { db, addInvitationCode, updatePartner, updateCustomer } = useDatabase();
  const { partners, customers, invitationCodes } = db;

  const [activeTab, setActiveTab] = useState<'overview' | 'downline' | 'codes'>('overview');
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<DownlineMember | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states for creating code
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(50);
  const [newCodeNotes, setNewCodeNotes] = useState('');

  // Get partner's invitation codes
  const myCodes = invitationCodes.filter(c => c.partnerId === user?.partnerId);

  // Build downline data
  const buildDownline = (): DownlineMember[] => {
    const downline: DownlineMember[] = [];

    // Get referred partners
    const referredPartners = partners.filter(p => p.referredBy === user?.partnerId);
    referredPartners.forEach(p => {
      downline.push({
        id: p.id,
        name: p.name,
        email: p.email,
        type: 'partner',
        joinedAt: p.joinedAt,
        totalSpent: p.totalPurchases,
        discountRate: p.discountRate,
        status: p.status,
      });
    });

    // Get customers who used this partner's code
    const myCodeStrings = myCodes.map(c => c.code);
    const myCustomers = customers.filter(c =>
      c.invitedBy === user?.id || myCodeStrings.includes(c.invitationCode || '')
    );
    myCustomers.forEach(c => {
      downline.push({
        id: c.id,
        name: c.name,
        email: c.email,
        type: 'customer',
        joinedAt: c.joinedAt,
        totalSpent: c.totalSpent,
        status: c.status,
      });
    });

    return downline.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  };

  const downline = buildDownline();
  const directPartners = downline.filter(d => d.type === 'partner');
  const directCustomers = downline.filter(d => d.type === 'customer');

  // Calculate stats
  const totalDownlineRevenue = downline.reduce((sum, d) => sum + (d.totalSpent || 0), 0);
  const activeCodes = myCodes.filter(c => c.isActive);
  const totalCodeUses = myCodes.reduce((sum, c) => sum + c.usedCount, 0);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCode = () => {
    const newCode: InvitationCode = {
      id: `inv${Date.now()}`,
      code: generateInvitationCode('GT'),
      type: 'partner_user',
      createdBy: user?.id || '',
      createdByName: user?.name || '',
      partnerId: user?.partnerId,
      partnerName: user?.name,
      createdAt: new Date().toISOString().split('T')[0],
      maxUses: newCodeMaxUses,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      notes: newCodeNotes,
    };

    addInvitationCode(newCode);
    setShowCreateCodeModal(false);
    setNewCodeMaxUses(50);
    setNewCodeNotes('');
  };

  const handleEditMember = (member: DownlineMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleSaveMemberEdit = () => {
    if (!editingMember) return;

    // Update partner discount rate if it's a partner
    if (editingMember.type === 'partner') {
      if (editingMember.discountRate !== undefined) {
        updatePartner(editingMember.id, { discountRate: editingMember.discountRate });
      }
    }

    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleDeactivateMember = (memberId: string) => {
    const partner = partners.find(p => p.id === memberId);
    if (partner) {
      updatePartner(memberId, { status: partner.status === 'active' ? 'inactive' : 'active' });
    } else {
      const customer = customers.find(c => c.id === memberId);
      if (customer) {
        updateCustomer(memberId, { status: customer.status === 'active' ? 'inactive' : 'active' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="My Network | Partner" description="View and manage your partner referral network." />
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">My Network</h2>
        <p className="text-muted-foreground">Manage your referrals and invitation codes</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-card p-1 rounded-lg border border-border w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'downline', label: 'My Downline', icon: Users },
          { id: 'codes', label: 'Invitation Codes', icon: LinkIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'downline' | 'codes')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-muted-foreground hover:bg-muted'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Downline</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{downline.length}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <UserPlus className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-muted-foreground">Partners</span>
              </div>
              <p className="text-2xl font-semibold text-indigo-600">{directPartners.length}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Downline Revenue</span>
              </div>
              <p className="text-2xl font-semibold text-emerald-600">{formatTHB(totalDownlineRevenue)}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <LinkIcon className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Active Codes</span>
              </div>
              <p className="text-2xl font-semibold text-amber-600">{activeCodes.length}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateCodeModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Invitation Code</span>
              </button>
              <button
                onClick={() => setActiveTab('downline')}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>View Downline</span>
              </button>
            </div>
          </div>

          {/* Recent Signups */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Recent Signups</h3>
            </div>
            <div className="divide-y divide-border">
              {downline.slice(0, 5).map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.type === 'partner' ? 'bg-indigo-100' : 'bg-muted'
                      }`}>
                      <span className={`font-medium ${member.type === 'partner' ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                        {(member.name || member.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name || member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${member.type === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-foreground'
                      }`}>
                      {member.type === 'partner' ? 'Partner' : 'Customer'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{member.joinedAt}</p>
                  </div>
                </div>
              ))}
              {downline.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No downline members yet. Create invitation codes to start growing your network!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Downline Tab */}
      {activeTab === 'downline' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">My Downline</h3>
              <p className="text-sm text-muted-foreground">{directPartners.length} partners, {directCustomers.length} customers</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {downline.map((member) => (
              <div key={member.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${member.type === 'partner' ? 'bg-indigo-100' : 'bg-muted'
                      }`}>
                      <span className={`font-medium text-lg ${member.type === 'partner' ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                        {(member.name || member.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-foreground">{member.name || member.email}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${member.type === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-foreground'
                          }`}>
                          {member.type === 'partner' ? 'Partner' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Joined {member.joinedAt}</span>
                        </span>
                        {member.totalSpent !== undefined && (
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{formatTHB(member.totalSpent)} spent</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditMember(member)}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-muted-foreground"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {downline.length === 0 && (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No downline members yet</p>
                <button
                  onClick={() => setActiveTab('codes')}
                  className="mt-2 text-foreground underline"
                >
                  Create invitation codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">My Invitation Codes</h3>
              <p className="text-sm text-muted-foreground">{myCodes.length} codes, {totalCodeUses} total uses</p>
            </div>
            <button
              onClick={() => setShowCreateCodeModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Code</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCodes.map((code) => (
              <div key={code.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-mono font-bold text-foreground">{code.code}</span>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{code.notes || 'No notes'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${code.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'
                    }`}>
                    {code.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Uses</p>
                    <p className="font-semibold text-foreground">{code.usedCount}/{code.maxUses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-semibold text-foreground">{code.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1.5">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all"
                        style={{ width: `${(code.usedCount / code.maxUses) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {myCodes.length === 0 && (
            <div className="bg-muted rounded-xl border border-border p-12 text-center">
              <LinkIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No invitation codes yet</p>
              <p className="text-sm text-muted-foreground">Create codes to invite customers to your network</p>
            </div>
          )}
        </div>
      )}

      {/* Create Code Modal */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Create Invitation Code</h3>
              <button
                onClick={() => setShowCreateCodeModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newCodeMaxUses}
                  onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={newCodeNotes}
                  onChange={(e) => setNewCodeNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border"
                  placeholder="e.g., VIP customers, March promotion..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateCodeModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCode}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Create Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Edit Member</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${editingMember.type === 'partner' ? 'bg-indigo-100' : 'bg-muted'
                  }`}>
                  <span className={`font-medium ${editingMember.type === 'partner' ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                    {(editingMember.name || editingMember.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{editingMember.name || editingMember.email}</p>
                  <p className="text-sm text-muted-foreground">{editingMember.email}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${editingMember.type === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-foreground'
                    }`}>
                    {editingMember.type === 'partner' ? 'Partner' : 'Customer'}
                  </span>
                </div>
              </div>

              {editingMember.type === 'partner' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={editingMember.discountRate || 15}
                    onChange={(e) => setEditingMember({ ...editingMember, discountRate: parseInt(e.target.value) || 15 })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the discount rate this partner receives on purchases
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Member Status</p>
                  <p className="text-sm text-muted-foreground">
                    Currently {editingMember.status}
                  </p>
                </div>
                <button
                  onClick={() => handleDeactivateMember(editingMember.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${editingMember.status === 'active'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                >
                  {editingMember.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMemberEdit}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
