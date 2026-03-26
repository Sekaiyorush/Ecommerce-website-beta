import { useState, useEffect } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { Save, AlertCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';

export function SettingsManagement() {
    const { db, updateSiteSettings } = useDatabase();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        companyDescription: '',
        contactEmail: '',
        contactPhone: '',
        contactLocation: '',
        businessHours: '',
        shippingInfo: ''
    });

    // Sync form data when external settings are loaded/changed
     
    useEffect(() => {
        if (db.siteSettings) {
            setFormData({
                companyName: db.siteSettings.companyName || '',
                companyDescription: db.siteSettings.companyDescription || '',
                contactEmail: db.siteSettings.contactEmail || '',
                contactPhone: db.siteSettings.contactPhone || '',
                contactLocation: db.siteSettings.contactLocation || '',
                businessHours: db.siteSettings.businessHours || '',
                shippingInfo: db.siteSettings.shippingInfo || ''
            });
        }
    }, [db.siteSettings]);
     

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        const success = await updateSiteSettings(formData);

        setIsSubmitting(false);
        if (success) {
            setSuccessMessage('Settings updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <SEO title="Settings | Admin" description="Configure site settings and business information." />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Global Site Settings</h2>
                    <p className="text-muted-foreground">Manage landing page content, contact info, and site details.</p>
                </div>
            </div>

            <div className="bg-background rounded-lg border border-border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Landing Page Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium border-b border-border pb-2">Landing Page</h3>
                        <p className="text-sm text-muted-foreground">
                            These fields are displayed on the public landing page that visitors see before logging in.
                        </p>

                        <div>
                            <label className="block text-sm font-medium mb-1">Company Name</label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                placeholder="Golden Tier Peptide"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Company Description</label>
                            <textarea
                                value={formData.companyDescription}
                                onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                                className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                placeholder="Premium research-grade peptides..."
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium border-b border-border pb-2">Contact Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Support Email</label>
                                <input
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                    placeholder="support@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number (or Instructions)</label>
                                <input
                                    type="text"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                    placeholder="e.g. +1 (555) 000-0000 or 'Email first'"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.contactLocation}
                                    onChange={(e) => setFormData({ ...formData, contactLocation: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                    placeholder="United States"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Business Hours</label>
                                <input
                                    type="text"
                                    value={formData.businessHours}
                                    onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                    placeholder="Mon-Fri, 9AM-5PM"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Policy Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium border-b border-border pb-2">Policy Settings</h3>

                        <div>
                            <label className="block text-sm font-medium mb-1">Shipping Info Short Text</label>
                            <input
                                type="text"
                                value={formData.shippingInfo}
                                onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
                                className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                                placeholder="Shipping worldwide"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
                        </button>

                        {successMessage && (
                            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" /> {successMessage}
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
