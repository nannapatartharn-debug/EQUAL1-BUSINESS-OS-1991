import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Flashlight,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Barcode,
  QrCode,
  ShoppingBag,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, Customer } from '../types';
import { playTactileHaptic } from '../lib/security';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers?: Customer[];
  onProductScanned: (product: Product) => void;
  onCustomerScanned?: (customer: Customer) => void;
  cartCount?: number;
  onGoToCheckout?: () => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  customers = [],
  onProductScanned,
  onCustomerScanned,
  cartCount = 0,
  onGoToCheckout,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedItem, setLastScannedItem] = useState<{
    product?: Product;
    customer?: Customer;
    timestamp: number;
  } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'equal1-camera-barcode-reader';

  // Process barcode or QR code text
  const handleDecodedCode = (decodedText: string) => {
    const code = decodedText.trim();
    if (!code) return;

    // Check if matching a product barcode or SKU
    const matchedProduct = products.find(
      (p) =>
        p.barcode === code ||
        p.sku.toLowerCase() === code.toLowerCase() ||
        p.name.toLowerCase().includes(code.toLowerCase())
    );

    if (matchedProduct) {
      playTactileHaptic('success');
      onProductScanned(matchedProduct);
      setLastScannedItem({
        product: matchedProduct,
        timestamp: Date.now(),
      });
      return;
    }

    // Check if matching a customer ID or phone
    const matchedCustomer = customers.find(
      (c) =>
        c.id.toLowerCase() === code.toLowerCase() ||
        (c.phone && c.phone.replace(/[^0-9]/g, '') === code.replace(/[^0-9]/g, ''))
    );

    if (matchedCustomer && onCustomerScanned) {
      playTactileHaptic('success');
      onCustomerScanned(matchedCustomer);
      setLastScannedItem({
        customer: matchedCustomer,
        timestamp: Date.now(),
      });
      return;
    }

    // If no match found
    playTactileHaptic('error');
    setCameraError(`สแกนรหัส "${code}" สำเร็จ แต่ไม่พบรายการในฐานข้อมูลสินค้าหรือสมาชิก`);
    setTimeout(() => setCameraError(null), 4000);
  };

  // Initialize and start camera scanner
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const qrRegion = document.getElementById(readerElementId);
    if (!qrRegion) return;

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
    ];

    const html5QrCode = new Html5Qrcode(readerElementId, {
      formatsToSupport,
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      qrbox: { width: 280, height: 180 },
      aspectRatio: 1.333,
    };

    html5QrCode
      .start(
        { facingMode },
        config,
        (decodedText) => {
          if (!isMounted) return;
          handleDecodedCode(decodedText);
        },
        () => {
          // ignore frame scan errors
        }
      )
      .then(() => {
        if (isMounted) {
          setIsScanning(true);
          setIsCameraActive(true);
          setCameraError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Camera scan start notice:', err);
          setIsCameraActive(false);
          setIsScanning(false);
          setCameraError(
            'ไม่สามารถเข้าถึงกล้องของอุปกรณ์ได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง (Camera Permission) ในเบราว์เซอร์ หรือใช้ปุ่มจำลองบาร์โค้ดด้านล่าง'
          );
        }
      });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current?.clear();
            })
            .catch((e) => console.warn('Scanner stop error:', e));
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, [isOpen, facingMode]);

  // Flip camera between environment (back) and user (front)
  const handleToggleCamera = async () => {
    playTactileHaptic('keypad');
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedCode(manualCode);
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#171717] border border-white/15 text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#1C1B19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6A055] text-black flex items-center justify-center shadow font-black">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>สแกนบาร์โค้ด / QR Code (Camera Scanner)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              </h3>
              <p className="text-[11px] text-[#A8A499]">
                ส่องกล้องไปที่บาร์โค้ดสินค้าเพื่อเพิ่มลงตะกร้าทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleCamera}
              title="สลับกล้องหน้า/หลัง"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D1CCC2] hover:text-white transition"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              title="ปิดหน้าต่าง"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D1CCC2] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Code Container */}
          <div id={readerElementId} className="w-full h-full object-cover" />

          {/* Scanner Viewfinder HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            {/* Viewfinder Target Box with Corner Accents */}
            <div className="relative w-64 h-40 border-2 border-white/20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#E6A055] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#E6A055] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#E6A055] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#E6A055] rounded-br-lg" />

              {/* Animated Laser Beam */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#E6A055] to-transparent shadow-[0_0_12px_#E6A055] animate-pulse" />

              <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
                Align Barcode
              </span>
            </div>

            <p className="text-[11px] text-white/80 font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              รองรับทั้งบาร์โค้ดสินค้า (EAN-13, 128) และ QR Code สมาชิก
            </p>
          </div>

          {/* Camera Permission Error Notice */}
          {cameraError && (
            <div className="absolute inset-x-4 top-4 z-20 p-3 bg-rose-950/90 border border-rose-500/50 rounded-2xl text-rose-200 text-xs shadow-xl flex items-start gap-2 backdrop-blur-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{cameraError}</span>
              </div>
            </div>
          )}

          {/* Instant Scanned Item Toast (Pop-up Banner) */}
          {lastScannedItem && (
            <div className="absolute inset-x-4 bottom-4 z-20 p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl text-white shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                {lastScannedItem.product?.image_url ? (
                  <img
                    src={lastScannedItem.product.image_url}
                    alt={lastScannedItem.product.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      สแกนสำเร็จ · เพิ่มลงตะกร้าแล้ว
                    </span>
                  </div>
                  <strong className="text-xs font-black text-white block">
                    {lastScannedItem.product?.name || lastScannedItem.customer?.name}
                  </strong>
                  <span className="text-[11px] text-[#C4BEB5] font-mono">
                    ฿{lastScannedItem.product?.price} · SKU: {lastScannedItem.product?.sku}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 bg-white/20 rounded-lg text-xs font-bold text-emerald-300">
                  +1 ชิ้น
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Bottom Control Panel */}
        <div className="p-4 bg-[#1C1B19] border-t border-white/10 space-y-3.5 text-xs">
          {/* Quick Barcode Simulation Buttons for Testing */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#A8A499] uppercase tracking-wider font-mono block">
              กดทดสอบยิงบาร์โค้ดตัวอย่างสินค้า (Quick Test Barcodes):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleDecodedCode(p.barcode || p.sku)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 rounded-xl text-[11px] text-white font-medium transition flex items-center gap-1"
                >
                  <Barcode className="w-3 h-3 text-[#E6A055]" />
                  <span className="truncate max-w-[130px]">{p.name.split(' ')[0]} (฿{p.price})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                type="text"
                placeholder="กรอกเลขบาร์โค้ด หรือชื่อสินค้าด้วยตนเอง..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-[#E6A055]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition"
            >
              ค้นหา
            </button>
          </form>

          {/* Bottom Cart Status & Checkout Action */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#E6A055]" />
              <span className="text-[#C4BEB5]">
                สินค้าในตะกร้าปัจจุบัน: <strong className="text-white">{cartCount} ชิ้น</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#D1CCC2] text-xs font-semibold rounded-xl transition"
              >
                ปิดหน้ากล้อง
              </button>

              {onGoToCheckout && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToCheckout();
                  }}
                  className="px-4 py-1.5 bg-[#E6A055] hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <span>ไปคิดเงินที่ POS ({cartCount})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
