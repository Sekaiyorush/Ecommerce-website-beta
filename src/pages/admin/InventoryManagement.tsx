import { useState } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import type { ProductVariant } from '@/data/products';
import {
    PackageSearch,
    Plus,
    Minus,
    Search,
    AlertTriangle,
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SEO } from '@/components/SEO';

interface AdjustTarget {
    productId: string;
    variantSku?: string;
    label: string;
}

export function InventoryManagement() {
    const { db, addInventoryLog } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null);
    const [adjustData, setAdjustData] = useState({
        changeQuantity: 0,
        reason: 'received' as 'received' | 'sold' | 'damaged' | 'returned' | 'adjustment',
        notes: ''
    });

    const products = db.products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const logs = db.inventoryLogs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const productLogs = selectedProduct
        ? logs.filter(l => l.productId === selectedProduct)
        : logs;

    // Build low stock alerts — check both product-level and per-variant
    const lowStockAlerts: { productName: string; sku: string; stock: number; label?: string }[] = [];
    products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => {
                if (v.stock < (p.lowStockThreshold || 10)) {
                    lowStockAlerts.push({ productName: p.name, sku: v.sku, stock: v.stock, label: v.label });
                }
            });
        } else if (p.stockQuantity < (p.lowStockThreshold || 10)) {
            lowStockAlerts.push({ productName: p.name, sku: p.sku, stock: p.stockQuantity });
        }
    });

    const toggleExpand = (id: string) => {
        setExpandedProducts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openAdjustModal = (productId: string, variantSku?: string, label?: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const displayLabel = variantSku && label
            ? `${product.name} — ${label}`
            : product.name;
        setAdjustTarget({ productId, variantSku, label: displayLabel });
        setSelectedProduct(productId);
        setAdjustData({ changeQuantity: 0, reason: 'received', notes: '' });
        setIsAdjustModalOpen(true);
    };

    const handleAdjustStock = () => {
        if (!adjustTarget) return;

        addInventoryLog({
            productId: adjustTarget.productId,
            changeQuantity: adjustData.changeQuantity,
            reason: adjustData.reason,
            notes: adjustData.notes,
            variantSku: adjustTarget.variantSku,
        }, !!adjustTarget.variantSku);

        setIsAdjustModalOpen(false);
        setAdjustTarget(null);
        setAdjustData({ changeQuantity: 0, reason: 'received', notes: '' });
    };

    const getVariantTotalStock = (variants: ProductVariant[]) =>
        variants.reduce((sum, v) => sum + v.stock, 0);

    return (
        <div className="space-y-6">
            <SEO title="Inventory | Admin" description="Manage product stock levels and inventory tracking." />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Inventory Management</h2>
                    <p className="text-muted-foreground">Track and adjust product &amp; variant stock levels</p>
                </div>
            </div>

            {lowStockAlerts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-amber-800 font-medium mb-3">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Low Stock Alerts ({lowStockAlerts.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {lowStockAlerts.slice(0, 9).map((alert, i) => (
                            <div key={i} className="bg-card p-3 rounded-lg border border-amber-100 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-foreground text-sm">{alert.productName}</p>
                                    {alert.label && <p className="text-xs text-muted-foreground">{alert.label}</p>}
                                    <p className="text-xs text-muted-foreground">SKU: {alert.sku}</p>
                                </div>
                                <p className="text-lg font-bold text-red-600">{alert.stock}</p>
                            </div>
                        ))}
                        {lowStockAlerts.length > 9 && (
                            <div className="bg-card p-3 rounded-lg border border-amber-100 flex items-center justify-center">
                                <p className="text-sm text-amber-700 font-medium">+{lowStockAlerts.length - 9} more</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products List */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Products Stock</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-border"
                            />
                        </div>
                    </div>
                    <div className="overflow-auto flex-1 p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-sm text-muted-foreground">
                                    <th className="pb-3 font-medium">Product / SKU</th>
                                    <th className="pb-3 font-medium text-right">Current Stock</th>
                                    <th className="pb-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map(p => {
                                    const hasVariants = p.variants && p.variants.length > 0;
                                    const isExpanded = expandedProducts.has(p.id);

                                    return (
                                        <tr key={p.id} className="group">
                                            <td colSpan={3} className="p-0">
                                                {/* Product row */}
                                                <div
                                                    className={`flex items-center py-3 px-1 cursor-pointer hover:bg-muted ${selectedProduct === p.id ? 'bg-muted' : ''}`}
                                                    onClick={() => {
                                                        setSelectedProduct(p.id);
                                                        if (hasVariants) toggleExpand(p.id);
                                                    }}
                                                >
                                                    <div className="flex-1 flex items-center gap-2">
                                                        {hasVariants && (
                                                            <span className="text-muted-foreground">
                                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            </span>
                                                        )}
                                                        {!hasVariants && <span className="w-4" />}
                                                        <div>
                                                            <p className="font-medium text-foreground">{p.name}</p>
                                                            <p className="text-xs text-muted-foreground">{p.sku}{hasVariants ? ` · ${p.variants!.length} variants` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right mr-4">
                                                        <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                                                            hasVariants
                                                                ? (getVariantTotalStock(p.variants!) < (p.lowStockThreshold || 10) * p.variants!.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                                                                : (p.stockQuantity <= (p.lowStockThreshold || 10) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')
                                                        }`}>
                                                            {hasVariants
                                                                ? `${getVariantTotalStock(p.variants!)} total`
                                                                : `${p.stockQuantity} units`}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        {!hasVariants && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openAdjustModal(p.id);
                                                                }}
                                                                className="px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors text-sm font-medium"
                                                            >
                                                                Adjust
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded variant rows */}
                                                {hasVariants && isExpanded && (
                                                    <div className="ml-7 mb-2">
                                                        {p.variants!.map(v => (
                                                            <div
                                                                key={v.sku}
                                                                className="flex items-center py-2 px-3 bg-muted/50 border-l-2 border-border hover:bg-muted text-sm"
                                                            >
                                                                <div className="flex-1">
                                                                    <span className="text-foreground font-medium">{v.label}</span>
                                                                    <span className="text-muted-foreground text-xs ml-2">{v.sku}</span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium mr-3 ${
                                                                    v.stock <= 0 ? 'bg-red-100 text-red-700'
                                                                    : v.stock < (p.lowStockThreshold || 10) ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                                }`}>
                                                                    {v.stock}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openAdjustModal(p.id, v.sku, v.label);
                                                                    }}
                                                                    className="px-2 py-0.5 bg-muted text-muted-foreground rounded hover:bg-muted transition-colors text-xs font-medium"
                                                                >
                                                                    Adjust
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Product Details & History */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col h-[600px]">
                    <h3 className="font-semibold text-foreground mb-4">Stock History</h3>

                    {selectedProduct ? (
                        <div className="flex-1 overflow-auto">
                            <div className="bg-muted p-4 rounded-lg border border-border mb-4 flex items-start gap-4">
                                <div className="bg-card p-2 rounded-lg border border-border shadow-sm shrink-0">
                                    <QRCodeSVG
                                        value={`https://goldentierpeptide.com/product/${products.find(p => p.id === selectedProduct)?.sku}`}
                                        size={80}
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{products.find(p => p.id === selectedProduct)?.name}</p>
                                    <p className="text-sm text-muted-foreground mb-2">Scan to view product page</p>
                                    {(() => {
                                        const prod = products.find(p => p.id === selectedProduct);
                                        if (!prod) return null;
                                        if (prod.variants && prod.variants.length > 0) {
                                            return (
                                                <div className="flex flex-wrap gap-1 text-xs">
                                                    {prod.variants.map(v => (
                                                        <span key={v.sku} className="bg-card px-2 py-1 rounded border border-border">
                                                            {v.label}: {v.stock}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="flex gap-2 text-xs">
                                                <span className="bg-card px-2 py-1 rounded border border-border">
                                                    Stock: {prod.stockQuantity}
                                                </span>
                                                <span className="bg-card px-2 py-1 rounded border border-border">
                                                    Thr: {prod.lowStockThreshold || 10}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {productLogs.length > 0 ? productLogs.map(log => (
                                    <div key={log.id} className="p-3 border border-border rounded-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.changeQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.changeQuantity > 0 ? '+' : ''}{log.changeQuantity}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground capitalize">{log.reason}</p>
                                        {log.variantSku && (
                                            <p className="text-xs text-muted-foreground mt-0.5">Variant: {log.variantSku}</p>
                                        )}
                                        {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                                        <p className="text-xs text-muted-foreground mt-1">By {log.performedByName}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No history for this product.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <PackageSearch className="h-12 w-12 mb-2 opacity-50" />
                            <p>Select a product to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {isAdjustModalOpen && adjustTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl max-w-sm w-full p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Adjust Stock</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 hover:bg-muted rounded">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="text-sm font-medium text-foreground mb-4">
                            {adjustTarget.label}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Reason</label>
                                <select
                                    value={adjustData.reason}
                                    onChange={e => setAdjustData({ ...adjustData, reason: e.target.value as 'received' | 'sold' | 'damaged' | 'returned' | 'adjustment' })}
                                    className="w-full p-2 border border-border rounded-lg text-sm"
                                >
                                    <option value="received">Received (+)</option>
                                    <option value="returned">Returned (+)</option>
                                    <option value="sold">Sold (-)</option>
                                    <option value="damaged">Damaged (-)</option>
                                    <option value="adjustment">Manual Adjustment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity Change</label>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setAdjustData(d => ({ ...d, changeQuantity: d.changeQuantity - 1 }))} className="p-2 bg-muted rounded hover:bg-muted"><Minus className="h-4 w-4" /></button>
                                    <input
                                        type="number"
                                        value={adjustData.changeQuantity}
                                        onChange={e => setAdjustData({ ...adjustData, changeQuantity: parseInt(e.target.value) || 0 })}
                                        className="flex-1 p-2 border border-border rounded-lg text-center font-bold"
                                    />
                                    <button type="button" onClick={() => setAdjustData(d => ({ ...d, changeQuantity: d.changeQuantity + 1 }))} className="p-2 bg-muted rounded hover:bg-muted"><Plus className="h-4 w-4" /></button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={adjustData.notes}
                                    onChange={e => setAdjustData({ ...adjustData, notes: e.target.value })}
                                    className="w-full p-2 border border-border rounded-lg text-sm"
                                    placeholder="e.g. Broken vial during shipping"
                                />
                            </div>

                            <button
                                onClick={handleAdjustStock}
                                disabled={adjustData.changeQuantity === 0}
                                className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
                            >
                                Save Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
