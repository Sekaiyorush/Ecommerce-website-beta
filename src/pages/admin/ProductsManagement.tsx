import { useState, useMemo, useCallback } from 'react';
import { type Product, type ProductVariant } from '@/data/products';
import { useDatabase } from '@/context/DatabaseContext';
import { useToast } from '@/components/ui/useToast';
import { formatTHB } from '@/lib/formatPrice';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  QrCode,
  Edit,
  Copy,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpDown,
  History,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';

interface VariantFormRow {
  sku: string;
  label: string;
  price: string;
  stock: string;
}

interface ProductFormData {
  name: string;
  description: string;
  fullDescription: string;
  price: string;
  category: string;
  purity: string;
  stockQuantity: string;
  sku: string;
  benefits: string;
  dosage: string;
  imageUrl: string;
  variants: VariantFormRow[];
}

export function ProductsManagement() {
  const { db, addProduct: contextAddProduct, updateProduct: contextUpdateProduct, deleteProduct: contextDeleteProduct } = useDatabase();
  const { addToast } = useToast();
  const productList = db.products;
  const dynamicCategories = Array.from(new Set(productList.map(p => p.category))).sort();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showQRCode, setShowQRCode] = useState<Product | null>(null);

  const emptyFormData: ProductFormData = {
    name: '',
    description: '',
    fullDescription: '',
    price: '',
    category: '',
    purity: '99.0%',
    stockQuantity: '0',
    sku: '',
    benefits: '',
    dosage: '',
    imageUrl: '',
    variants: [],
  };

  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);

  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [productList, searchTerm, selectedCategory]);

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} products?`)) {
      selectedIds.forEach(id => contextDeleteProduct(id));
      setSelectedIds(new Set());
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      fullDescription: product.fullDescription || '',
      price: product.price.toString(),
      category: product.category,
      purity: product.purity,
      stockQuantity: product.stockQuantity.toString(),
      sku: product.sku,
      benefits: product.benefits?.join('\n') || '',
      dosage: product.dosage || '',
      imageUrl: product.imageUrl || '',
      variants: (product.variants || []).map(v => ({
        sku: v.sku,
        label: v.label,
        price: v.price.toString(),
        stock: v.stock.toString(),
      })),
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      contextDeleteProduct(productId);
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    contextAddProduct(duplicated);
  };

  const addVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { sku: '', label: '', price: '', stock: '100' }],
    }));
  };

  const removeVariantRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const updateVariantRow = (idx: number, field: keyof VariantFormRow, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v),
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedVariants: ProductVariant[] = formData.variants
      .filter(v => v.sku && v.label && v.price)
      .map(v => ({
        sku: v.sku,
        label: v.label,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
      }));

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      fullDescription: formData.fullDescription,
      price: parseFloat(formData.price),
      category: formData.category,
      purity: formData.purity,
      inStock: parseInt(formData.stockQuantity) > 0,
      stockQuantity: parseInt(formData.stockQuantity),
      sku: formData.sku,
      benefits: formData.benefits.split('\n').filter(Boolean),
      dosage: formData.dosage,
      imageUrl: formData.imageUrl,
      createdAt: editingProduct?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      variants: parsedVariants.length > 0 ? parsedVariants : undefined,
    };

    if (editingProduct) {
      contextUpdateProduct(editingProduct.id, newProduct);
    } else {
      contextAddProduct(newProduct);
    }

    setIsModalOpen(false);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" /> };
    if (stock < 20) return { label: 'Low Stock', variant: 'outline' as const, icon: <AlertCircle className="h-3 w-3 text-amber-500" /> };
    return { label: 'In Stock', variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  const generateQRData = useCallback((product: Product) => {
    return JSON.stringify({
      id: product.id,
      sku: product.sku,
      name: product.name,
      batch: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      manufactured: new Date().toISOString().split('T')[0],
      purity: product.purity,
    });
  }, []);

  return (
    <div className="space-y-6">
      <SEO title="Products | Admin" description="Manage product catalog, pricing, and details." />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Products Management</h2>
          <p className="text-muted-foreground">Manage your product catalog, inventory, and variants.</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#B8860B] text-white rounded-lg transition-all shadow-md active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add New Product</span>
        </button>
      </div>

      {/* Bulk Actions & Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-[#D4AF37] text-white'
                  : 'bg-surface-alt border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All Products
            </button>
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-white'
                    : 'bg-surface-alt border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <BulkActionToolbar
          selectedCount={selectedIds.size}
          totalCount={filteredProducts.length}
          onClearSelection={() => setSelectedIds(new Set())}
          onSelectAll={handleSelectAll}
          actions={[
            {
              label: 'Delete Selected',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: handleBulkDelete,
              variant: 'danger',
            },
            {
              label: 'Export CSV',
              icon: <ArrowUpDown className="h-4 w-4" />,
              onClick: () => addToast({ type: 'info', message: 'Coming Soon: Export feature coming soon' }),
            }
          ]}
        />
      </div>

      {/* Products DataTable */}
      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-200">
        <Table>
          <TableHeader className="bg-surface-alt/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.stockQuantity);
              return (
                <TableRow key={product.id} className="group hover:bg-surface-alt/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => handleSelectRow(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#D4AF37]/50 transition-colors">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[#D4AF37]/5 text-[#B8860B] border-[#D4AF37]/20">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.variants && product.variants.length > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">From</span>
                        <span>{formatTHB(Math.min(...product.variants.map(v => v.price)))}</span>
                      </div>
                    ) : (
                      <span>{formatTHB(product.price)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{product.stockQuantity}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Units</span>
                    </div>
                    {product.variants && product.variants.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">{product.variants.length} variants</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="gap-1 px-2 py-0.5 shadow-sm">
                      {status.icon}
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded-full transition-colors">
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowQRCode(product)}>
                          <QrCode className="mr-2 h-4 w-4" /> QR Inventory
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center bg-surface-alt/20">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No products found</h3>
            <p className="text-muted-foreground max-w-xs text-center">Try adjusting your search or category filters to find what you looking for.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="mt-4 text-[#D4AF37] font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-alt/30">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {editingProduct ? 'Update Product' : 'Create New Product'}
                </h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to manage your catalog.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-auto">
              <Tabs defaultValue="basic" className="w-full">
                <div className="px-6 border-b border-border bg-background sticky top-0 z-10">
                  <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-transparent px-2 shadow-none">Basic Info</TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-transparent px-2 shadow-none">Inventory & Variants</TabsTrigger>
                    <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-transparent px-2 shadow-none">Specifications</TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-transparent px-2 shadow-none">Media</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 space-y-6">
                  <TabsContent value="basic" className="space-y-4 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">SKU *</label>
                        <input
                          type="text"
                          required
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Short Description *</label>
                      <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Full Description</label>
                      <textarea
                        rows={4}
                        value={formData.fullDescription}
                        onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Category</label>
                        <input
                          type="text"
                          list="category-options-modal"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                          placeholder="e.g. Healing, Metabolism"
                          required
                        />
                        <datalist id="category-options-modal">
                          {dynamicCategories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Purity Level</label>
                        <input
                          type="text"
                          value={formData.purity}
                          onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Base Price (THB) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">฿</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Base Stock Quantity *</label>
                        <input
                          type="number"
                          required
                          value={formData.stockQuantity}
                          onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                          <History className="h-4 w-4 text-[#D4AF37]" />
                          Product Variants
                        </label>
                        <button
                          type="button"
                          onClick={addVariantRow}
                          className="text-xs font-bold text-[#D4AF37] hover:text-[#B8860B] flex items-center gap-1 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Variant
                        </button>
                      </div>

                      {formData.variants.length > 0 ? (
                        <div className="space-y-3">
                          {formData.variants.map((v, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-surface-alt/20 p-3 rounded-xl border border-border">
                              <div className="col-span-3 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">SKU</label>
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={e => updateVariantRow(idx, 'sku', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background"
                                />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Label</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 5mg x 10"
                                  value={v.label}
                                  onChange={e => updateVariantRow(idx, 'label', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background"
                                />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Price</label>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={e => updateVariantRow(idx, 'price', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background"
                                />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Stock</label>
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={e => updateVariantRow(idx, 'stock', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background"
                                />
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(idx)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-surface-alt/30 border border-dashed border-border rounded-xl p-8 text-center">
                          <p className="text-sm text-muted-foreground italic">No variants configured. This product will use the base price and stock.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 m-0">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Dosage Protocol</label>
                      <input
                        type="text"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        placeholder="e.g. Subcutaneous injection, 250mcg daily"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Benefits (one per line)
                      </label>
                      <textarea
                        rows={6}
                        value={formData.benefits}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        placeholder="Accelerated Muscle Recovery&#10;Enhanced Fat Metabolism&#10;Improved Sleep Quality"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4 m-0">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Product Image URL</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {formData.imageUrl && (
                      <div className="mt-4 p-4 border border-border rounded-xl bg-surface-alt/20 flex flex-col items-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Preview</p>
                        <div className="h-48 w-48 rounded-xl border border-[#D4AF37]/30 overflow-hidden bg-card shadow-inner">
                          <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-contain" loading="lazy" />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>

              <div className="p-6 border-t border-border bg-surface-alt/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-[#D4AF37] hover:bg-[#B8860B] text-white rounded-lg font-bold shadow-md active:scale-95 transition-all"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-background rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-[#D4AF37]/30 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
                <QrCode className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Product QR Label</h3>
              <p className="text-[#D4AF37] font-medium">{showQRCode.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{showQRCode.sku}</p>
            </div>
            
            <div className="bg-card p-4 rounded-2xl shadow-inner inline-block border border-border">
              <QRCodeSVG
                value={generateQRData(showQRCode)}
                size={220}
                level="H"
                includeMargin={true}
                fgColor="#1a1a1a"
              />
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="bg-surface-alt/50 rounded-xl p-3 text-xs text-muted-foreground border border-border">
                Scan this code at the warehouse to instantly update inventory levels or verify product authenticity.
              </div>
              <button
                onClick={() => setShowQRCode(null)}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#B8860B] text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
