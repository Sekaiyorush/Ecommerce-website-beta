import { useState } from 'react';
import { type Partner } from '@/data/products';
import { useDatabase } from '@/context/DatabaseContext';
import { useToast } from '@/components/ui/useToast';
import { formatDate } from '@/lib/formatDate';
import { formatTHB } from '@/lib/formatPrice';
import {
  Plus,
  Search,
  Edit2,
  Mail,
  Phone,
  Building2,
  User,
  X,
  Percent,
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import { SEO } from '@/components/SEO';

interface PartnerFormData {
  name: string;
  email: string;
  password: string;
  company: string;
  phone: string;
  discountRate: string;
  status: 'active' | 'inactive' | 'pending';
  referredBy: string;
  notes: string;
}

const initialFormData: PartnerFormData = {
  name: '',
  email: '',
  password: '',
  company: '',
  phone: '',
  discountRate: '20',
  status: 'active',
  referredBy: '',
  notes: '',
};

export function PartnersManagement() {
  const { db, addPartner, updatePartner: contextUpdatePartner, deletePartner } = useDatabase();
  const { addToast } = useToast();
  const partnerList = db.partners;

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const filteredPartners = partnerList.filter(
    (partner) =>
      (partner.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPartner = () => {
    setEditingPartner(null);
    // Generate a random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...initialFormData, password: pw });
    setCreatedCredentials(null);
    setIsModalOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      email: partner.email || '',
      password: '',
      company: partner.company || '',
      phone: partner.phone || '',
      discountRate: partner.discountRate?.toString() || '20',
      status: partner.status || 'pending',
      referredBy: partner.referredBy || '',
      notes: partner.notes || '',
    });
    setCreatedCredentials(null);
    setIsModalOpen(true);
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (window.confirm(`Are you SURE you want to completely delete the partner account for ${partner.name}? This action cannot be undone and will permanently remove their access.`)) {
      const result = await deletePartner(partner.id);
      if (!result.success) {
        addToast({
          type: 'error',
          message: result.error || 'Delete Failed: Failed to delete partner account',
        });
      } else {
        addToast({
          type: 'success',
          message: `Partner Deleted: ${partner.name}'s account has been deleted successfully.`,
        });
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData(initialFormData);
    setCreatedCredentials(null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.company || !formData.phone) {
      setFormError('Please fill in all required fields');
      return;
    }
    setFormError('');

    setIsSubmitting(true);

    if (editingPartner) {
      // Update existing partner
      contextUpdatePartner(editingPartner.id, {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        status: formData.status,
        discountRate: parseInt(formData.discountRate) || 20,
        referredBy: formData.referredBy || undefined,
        notes: formData.notes,
      });
      setIsSubmitting(false);
      handleCloseModal();
    } else {
      // Create new partner account in Supabase
      if (!formData.password || formData.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        setIsSubmitting(false);
        return;
      }

      const result = await addPartner({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        phone: formData.phone,
        discountRate: parseInt(formData.discountRate) || 20,
        status: formData.status,
        referredBy: formData.referredBy || undefined,
        notes: formData.notes,
      });

      setIsSubmitting(false);

      if (result.success) {
        setCreatedCredentials({ email: formData.email, password: formData.password });
      } else {
        setFormError(`Error creating partner: ${result.error}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'inactive':
        return 'bg-muted text-foreground';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Partners | Admin" description="Manage partner accounts and discount rates." />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Partners</h2>
          <p className="text-muted-foreground">Manage your partner network and discount rates</p>
        </div>
        <button
          onClick={handleAddPartner}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Partners</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{partnerList.length}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-600">
            {partnerList.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <ShoppingBag className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-muted-foreground">Total Purchases</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {formatTHB(partnerList.reduce((sum, p) => sum + p.totalPurchases, 0))}
          </p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Total Resold</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {formatTHB(partnerList.reduce((sum, p) => sum + p.totalResold, 0))}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search partners by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* Partners Grid */}
      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{partner.name || partner.email}</h3>
                    <p className="text-sm text-muted-foreground">{partner.company}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(partner.status)}`}>
                  {partner.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{partner.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{partner.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Joined {formatDate(partner.joinedAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="font-semibold text-indigo-600">{partner.discountRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Purchases</p>
                  <p className="font-semibold text-foreground">{formatTHB(partner.totalPurchases)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Resold</p>
                  <p className="font-semibold text-emerald-600">{formatTHB(partner.totalResold)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-1 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => handleEditPartner(partner)}
                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit partner"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePartner(partner)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50 text-muted-foreground hover:text-red-600"
                  title="Delete partner permanently"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'No partners found matching your search' : 'No partners yet'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-foreground underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {createdCredentials ? 'Partner Created!' : editingPartner ? 'Edit Partner' : 'Create Partner Account'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createdCredentials ? (
              // Show credentials after successful creation
              <div className="p-5 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-800 font-medium mb-2">✓ Partner account created successfully!</p>
                  <p className="text-emerald-700 text-sm">Share these credentials with the partner so they can log in.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={createdCredentials.email}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted"
                    />
                    <button onClick={() => handleCopy(createdCredentials.email, 'email')} className="p-2 hover:bg-muted rounded-lg">
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={createdCredentials.password}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted font-mono"
                    />
                    <button onClick={() => handleCopy(createdCredentials.password, 'password')} className="p-2 hover:bg-muted rounded-lg">
                      {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleCopy(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`, 'both');
                  }}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {copiedField === 'both' ? '✓ Copied!' : 'Copy Both to Clipboard'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="w-full py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              // Form for creating/editing
              <form onSubmit={handleSavePartner} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    placeholder="Enter partner name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    placeholder="partner@company.com"
                    disabled={!!editingPartner}
                  />
                </div>

                {!editingPartner && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                        placeholder="Auto-generated password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This password will be shown after creation for you to share with the partner</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Discount Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.discountRate}
                      onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Partner['status'] })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Referred By (Partner)</label>
                  <select
                    value={formData.referredBy}
                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">None (Top Level)</option>
                    {partnerList.filter(p => p.id !== editingPartner?.id).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.email} - {p.company || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-slate-200"
                    placeholder="Add notes about this partner..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : editingPartner ? 'Update Partner' : 'Create Partner Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
