import { useState, useRef } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { type Product } from '@/data/products';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  Download,
  QrCode,
  Package,
  Calendar,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { SEO } from '@/components/SEO';

interface QRCodeData {
  id: string;
  sku: string;
  name: string;
  batch: string;
  manufactured: string;
  purity: string;
  quantity: number;
}

export function QRCodeManager() {
  const { db } = useDatabase();
  const products = db.products;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<QRCodeData[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateBatchNumber = () => {
    const prefix = selectedProduct?.sku || 'BATCH';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleGenerateQR = () => {
    if (!selectedProduct) return;

    const batch = batchNumber || generateBatchNumber();
    const newQRCodes: QRCodeData[] = [];

    for (let i = 0; i < quantity; i++) {
      const qrData: QRCodeData = {
        id: `${selectedProduct.id}-${Date.now()}-${i}`,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        batch: batch,
        manufactured: new Date().toISOString().split('T')[0],
        purity: selectedProduct.purity,
        quantity: 1,
      };
      newQRCodes.push(qrData);
    }

    setGeneratedQRCodes(newQRCodes);
  };

  const handleDownloadQR = (qrData: QRCodeData, index: number) => {
    const svg = document.getElementById(`qr-${index}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;

      // White background
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx!.drawImage(img, 50, 20, 300, 300);

      // Add text
      ctx!.fillStyle = 'black';
      ctx!.font = 'bold 20px Arial';
      ctx!.textAlign = 'center';
      ctx!.fillText(qrData.name, 200, 350);

      ctx!.font = '16px Arial';
      ctx!.fillText(`SKU: ${qrData.sku}`, 200, 380);
      ctx!.fillText(`Batch: ${qrData.batch}`, 200, 405);
      ctx!.fillText(`Purity: ${qrData.purity}`, 200, 430);
      ctx!.fillText(`Mfg: ${qrData.manufactured}`, 200, 455);

      const link = document.createElement('a');
      link.download = `QR-${qrData.sku}-${qrData.batch}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintAll = () => {
    window.print();
  };

  const getQRValue = (qrData: QRCodeData) => {
    return JSON.stringify({
      productId: qrData.id,
      sku: qrData.sku,
      name: qrData.name,
      batch: qrData.batch,
      manufactured: qrData.manufactured,
      purity: qrData.purity,
      scanUrl: `https://goldentier.com/track/${qrData.batch}`,
    });
  };

  return (
    <div className="space-y-6">
      <SEO title="QR Codes | Admin" description="Generate and manage product QR codes." />
      <div>
        <h2 className="text-2xl font-bold text-foreground">QR Code Generator</h2>
        <p className="text-muted-foreground">Generate QR codes for product tracking and inventory management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">1. Select Product</h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setBatchNumber(generateBatchNumber());
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left ${selectedProduct?.id === product.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-surface-alt'
                  }`}
              >
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                </div>
                {selectedProduct?.id === product.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* QR Configuration */}
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">2. Configure QR Code</h3>

          {selectedProduct ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Selected Product</label>
                <div className="p-3 bg-surface-alt rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Batch Number</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={() => setBatchNumber(generateBatchNumber())}
                    className="px-3 py-2 bg-surface-alt rounded-lg hover:bg-surface transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity to Generate</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
                />
              </div>

              <button
                onClick={handleGenerateQR}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span>Generate QR Codes</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a product to generate QR codes</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated QR Codes */}
      {generatedQRCodes.length > 0 && (
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Generated QR Codes ({generatedQRCodes.length})</h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePrintAll}
                className="flex items-center space-x-2 px-3 py-2 border border-input rounded-lg hover:bg-surface-alt transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print All</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {generatedQRCodes.map((qrData, index) => (
              <div key={qrData.id} className="text-center">
                <div
                  ref={qrRef}
                  className="bg-card p-3 rounded-lg border border-border inline-block"
                >
                  <QRCodeSVG
                    id={`qr-${index}`}
                    value={getQRValue(qrData)}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="mt-2 text-xs">
                    <p className="font-medium truncate">{qrData.name}</p>
                    <p className="text-muted-foreground truncate">{qrData.batch}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadQR(qrData, index)}
                  className="mt-2 flex items-center justify-center space-x-1 text-sm text-primary hover:underline mx-auto"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Scan Info */}
      <div className="bg-background rounded-lg border border-border p-6">
        <h3 className="font-semibold mb-4">QR Code Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-surface-alt rounded-lg">
            <p className="font-medium mb-2">What&apos;s included?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Product ID & SKU</li>
              <li>• Batch number</li>
              <li>• Manufacturing date</li>
              <li>• Purity percentage</li>
              <li>• Tracking URL</li>
            </ul>
          </div>
          <div className="p-4 bg-surface-alt rounded-lg">
            <p className="font-medium mb-2">Use cases</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Inventory tracking</li>
              <li>• Quality control</li>
              <li>• Supply chain management</li>
              <li>• Product authentication</li>
              <li>• Customer verification</li>
            </ul>
          </div>
          <div className="p-4 bg-surface-alt rounded-lg">
            <p className="font-medium mb-2">Scanning</p>
            <p className="text-muted-foreground">
              QR codes can be scanned with any smartphone camera or QR scanner app.
              Scanning will redirect to the product tracking page with full details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
