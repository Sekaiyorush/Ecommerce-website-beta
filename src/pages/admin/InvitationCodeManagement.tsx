import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import {
  generateInvitationCode,
  type InvitationCode,
  type InvitationCodeType
} from '@/data/invitations';
import {
  Plus,
  Copy,
  Check,
  X,
  Search,
  Link as LinkIcon,
  Users,
  UserPlus,
  Crown,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { SEO } from '@/components/SEO';

export function InvitationCodeManagement() {
  const { user } = useAuth();
  const { db, addInvitationCode, updateInvitationCode } = useDatabase();
  const invitationCodes = db.invitationCodes;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<InvitationCodeType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [bulkGenerateSuccess, setBulkGenerateSuccess] = useState(false);

  // Form states
  const [newCodeType, setNewCodeType] = useState<InvitationCodeType>('admin_user');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(50);
  const [newCodeDiscountRate, setNewCodeDiscountRate] = useState(15);
  const [newCodeExpiresAt, setNewCodeExpiresAt] = useState('');
  const [newCodeNotes, setNewCodeNotes] = useState('');
  const [newCodePrefix, setNewCodePrefix] = useState('GT');

  // Filter codes
  const filteredCodes = invitationCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.createdByName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || code.type === filterType;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? code.isActive : !code.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: invitationCodes.length,
    active: invitationCodes.filter(c => c.isActive).length,
    totalUses: invitationCodes.reduce((sum, c) => sum + c.usedCount, 0),
    adminCodes: invitationCodes.filter(c => c.type.startsWith('admin_')).length,
    partnerCodes: invitationCodes.filter(c => c.type === 'partner_user').length,
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCode = () => {
    const prefix = newCodeType === 'admin_partner' ? 'GTP' :
      newCodeType === 'partner_user' ? 'GT' : newCodePrefix;

    const newCode: InvitationCode = {
      id: `inv${Date.now()}`, // eslint-disable-line react-hooks/purity -- event handler, not render
      code: generateInvitationCode(prefix),
      type: newCodeType,
      createdBy: user?.id || '',
      createdByName: user?.name || '',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: newCodeExpiresAt || undefined,
      maxUses: newCodeMaxUses,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      notes: newCodeNotes,
      defaultDiscountRate: newCodeType === 'admin_partner' ? newCodeDiscountRate : undefined,
    };

    addInvitationCode(newCode);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewCodeType('admin_user');
    setNewCodeMaxUses(50);
    setNewCodeDiscountRate(15);
    setNewCodeExpiresAt('');
    setNewCodeNotes('');
    setNewCodePrefix('GT');
  };

  const handleToggleStatus = (codeStr: string) => {
    const code = invitationCodes.find(c => c.code === codeStr);
    if (code) {
      updateInvitationCode(codeStr, { isActive: !code.isActive });
    }
  };

  const handleDeleteCode = (codeStr: string) => {
    if (window.confirm("Are you sure you want to deactivate this code?")) {
      updateInvitationCode(codeStr, { isActive: false });
    }
  };

  const handleBulkGenerate = () => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const newCode: InvitationCode = {
        id: `inv${Date.now()}_${i}`,
        code: generateInvitationCode('BULK'),
        type: 'admin_user',
        createdBy: user?.id || '',
        createdByName: user?.name || '',
        createdAt: new Date().toISOString().split('T')[0],
        maxUses: 1,
        usedCount: 0,
        usedBy: [],
        isActive: true,
        notes: 'Bulk generated code',
      };
      addInvitationCode(newCode);
      codes.push(newCode.code);
    }
    // Copy all codes to clipboard
    navigator.clipboard.writeText(codes.join('\n'));
    setBulkGenerateSuccess(true);
    setTimeout(() => setBulkGenerateSuccess(false), 3000);
  };

  const getTypeIcon = (type: InvitationCodeType) => {
    switch (type) {
      case 'admin_user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'admin_partner': return <Crown className="h-4 w-4 text-amber-500" />;
      case 'partner_user': return <UserPlus className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTypeLabel = (type: InvitationCodeType) => {
    switch (type) {
      case 'admin_user': return 'User';
      case 'admin_partner': return 'Partner';
      case 'partner_user': return 'Partner Referral';
    }
  };

  const getTypeColor = (type: InvitationCodeType) => {
    switch (type) {
      case 'admin_user': return 'bg-blue-100 text-blue-700';
      case 'admin_partner': return 'bg-amber-100 text-amber-700';
      case 'partner_user': return 'bg-emerald-100 text-emerald-700';
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Invitation Codes | Admin" description="Create and manage invitation codes for registration." />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Invitation Codes</h2>
          <p className="text-muted-foreground">Manage invitation codes for users and partners</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBulkGenerate}
            disabled={bulkGenerateSuccess}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-80"
          >
            {bulkGenerateSuccess ? <Check className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4" />}
            <span className={bulkGenerateSuccess ? "text-emerald-600 font-medium" : ""}>{bulkGenerateSuccess ? "Generated & Copied!" : "Bulk Generate"}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Code</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Codes</p>
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active Codes</p>
          <p className="text-2xl font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Uses</p>
          <p className="text-2xl font-semibold text-indigo-600">{stats.totalUses}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground mb-1">Partner Codes</p>
          <p className="text-2xl font-semibold text-amber-600">{stats.partnerCodes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search codes, notes, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-border"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InvitationCodeType | 'all')}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All Types</option>
              <option value="admin_user">User Codes</option>
              <option value="admin_partner">Partner Codes</option>
              <option value="partner_user">Partner Referrals</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Uses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Created By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCodes.map((code) => (
                <tr key={code.code} className="hover:bg-muted">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-foreground">{code.code}</span>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {code.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{code.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getTypeColor(code.type)}`}>
                      {getTypeIcon(code.type)}
                      <span>{getTypeLabel(code.type)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{code.usedCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{code.maxUses}</span>
                    </div>
                    <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="bg-slate-900 h-1.5 rounded-full"
                        style={{ width: `${(code.usedCount / code.maxUses) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">{code.createdByName.charAt(0)}</span>
                      </div>
                      <span className="text-sm">{code.createdByName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {code.createdAt}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleStatus(code.code)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${code.isActive
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-muted text-foreground hover:bg-muted'
                        }`}
                    >
                      {code.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => { setSelectedCode(code); setShowDetailsModal(true); }}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCode(code.code)}
                        className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCodes.length === 0 && (
          <div className="p-12 text-center">
            <LinkIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No invitation codes found</p>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Create Invitation Code</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Code Type
                </label>
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value as InvitationCodeType)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                >
                  <option value="admin_user">User Registration</option>
                  <option value="admin_partner">Partner Registration</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {newCodeType === 'admin_partner'
                    ? 'Creates a partner account with discount benefits'
                    : 'Creates a regular customer account'}
                </p>
              </div>

              {newCodeType === 'admin_partner' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Default Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newCodeDiscountRate}
                    onChange={(e) => setNewCodeDiscountRate(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Expiration Date (optional)
                </label>
                <input
                  type="date"
                  value={newCodeExpiresAt}
                  onChange={(e) => setNewCodeExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                  placeholder="e.g., VIP customers, March promotion..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
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

      {/* Code Details Modal */}
      {showDetailsModal && selectedCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Code Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Code Display */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-foreground">{selectedCode.code}</span>
                  <button
                    onClick={() => handleCopyCode(selectedCode.code)}
                    className="p-2 bg-card rounded-lg hover:bg-muted transition-colors"
                  >
                    {copiedCode === selectedCode.code ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTypeIcon(selectedCode.type)}
                    <span className="font-medium">{getTypeLabel(selectedCode.type)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${selectedCode.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'
                    }`}>
                    {selectedCode.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uses</p>
                  <p className="font-medium">{selectedCode.usedCount} / {selectedCode.maxUses}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{selectedCode.createdAt}</p>
                </div>
                {selectedCode.expiresAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-medium">{selectedCode.expiresAt}</p>
                  </div>
                )}
                {selectedCode.defaultDiscountRate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Discount Rate</p>
                    <p className="font-medium">{selectedCode.defaultDiscountRate}%</p>
                  </div>
                )}
              </div>

              {/* Used By List */}
              {selectedCode.usedBy.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Used By</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCode.usedBy.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{user.userName.charAt(0)}</span>
                          </div>
                          <span className="font-medium">{user.userName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{user.usedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCode.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-foreground">{selectedCode.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
