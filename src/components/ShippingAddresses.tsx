import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
  Check
} from 'lucide-react';

interface ShippingAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  address_line: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

interface ShippingAddressFormData {
  label: string;
  full_name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

const initialForm: ShippingAddressFormData = {
  label: 'Home',
  full_name: '',
  address_line: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'US',
  phone: '',
  is_default: false,
};

interface ShippingAddressesProps {
  /** If provided, renders in "select" mode for checkout */
  onSelect?: (address: ShippingAddress) => void;
  selectedId?: string;
}

export function ShippingAddresses({ onSelect, selectedId }: ShippingAddressesProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [formData, setFormData] = useState<ShippingAddressFormData>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAddresses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching addresses:', error);
    } else {
      setAddresses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleOpenForm = (address?: ShippingAddress) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label,
        full_name: address.full_name,
        address_line: address.address_line,
        city: address.city,
        state: address.state || '',
        zip_code: address.zip_code || '',
        country: address.country,
        phone: address.phone || '',
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setFormData({ ...initialForm, full_name: user?.name || '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    setFormData(initialForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    // If setting as default, unset other defaults first
    if (formData.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    if (editingAddress) {
      const { error } = await supabase
        .from('shipping_addresses')
        .update({
          label: formData.label,
          full_name: formData.full_name,
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          country: formData.country,
          phone: formData.phone || null,
          is_default: formData.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAddress.id);

      if (error) {
        logger.error('Failed to update address:', error);
        setFormError('Failed to update address. Please try again.');
        setIsSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('shipping_addresses')
        .insert({
          user_id: user.id,
          label: formData.label,
          full_name: formData.full_name,
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          country: formData.country,
          phone: formData.phone || null,
          is_default: formData.is_default || addresses.length === 0,
        });

      if (error) {
        logger.error('Failed to save address:', error);
        setFormError('Failed to save address. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    handleCloseForm();
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    await supabase.from('shipping_addresses').delete().eq('id', id);
    fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    await supabase
      .from('shipping_addresses')
      .update({ is_default: true })
      .eq('id', id);
    fetchAddresses();
  };

  const isSelectMode = !!onSelect;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isSelectMode && (
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif text-foreground tracking-tight">Saved Addresses</h3>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center space-x-2 px-4 py-2 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors border border-[#111] shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD ADDRESS</span>
          </button>
        </div>
      )}

      {/* Address Cards */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 border border-[#D4AF37]/10">
          <MapPin className="h-10 w-10 text-[#D4AF37]/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4 tracking-wide">No saved addresses yet</p>
          <button
            onClick={() => handleOpenForm()}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] border-b border-[#D4AF37]/30 pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => isSelectMode && onSelect?.(addr)}
              className={`p-6 border transition-all ${isSelectMode
                ? `cursor-pointer hover:border-[#D4AF37]/50 ${selectedId === addr.id ? 'border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]/30' : 'border-[#D4AF37]/20'}`
                : 'border-[#D4AF37]/20'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C]">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="flex items-center space-x-1 text-[9px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200/50">
                      <Star className="h-2.5 w-2.5" />
                      <span>Default</span>
                    </span>
                  )}
                  {isSelectMode && selectedId === addr.id && (
                    <Check className="h-4 w-4 text-[#D4AF37]" />
                  )}
                </div>
                {!isSelectMode && (
                  <div className="flex items-center space-x-1">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="p-1.5 text-muted-foreground hover:text-[#AA771C] transition-colors"
                        title="Set as default"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenForm(addr)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <address className="not-italic text-sm text-muted-foreground leading-relaxed tracking-wide">
                <p className="font-medium text-foreground">{addr.full_name}</p>
                <p>{addr.address_line}</p>
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip_code}</p>
                <p>{addr.country}</p>
                {addr.phone && <p className="mt-1 text-muted-foreground">{addr.phone}</p>}
              </address>
            </div>
          ))}
          {isSelectMode && (
            <button
              onClick={() => handleOpenForm()}
              className="p-6 border border-dashed border-[#D4AF37]/30 flex flex-col items-center justify-center text-[#AA771C] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
            >
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">New Address</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between">
              <h3 className="text-lg font-serif text-foreground">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button onClick={handleCloseForm} className="p-2 hover:bg-muted rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">Label</label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-border text-foreground focus:ring-border"
                />
                <span className="text-sm text-muted-foreground">Set as default address</span>
              </label>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingAddress ? 'Update' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
