import { useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type QRScannerProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onScan: (code: string) => void;
};

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  async function startScanner() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Use BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        scanFrame();
      } else {
        // Fallback: use canvas + manual check every 500ms
        scanCanvasFallback();
      }
    } catch (err: any) {
      setError("Gagal akses kamera. Berikan izin kamera di browser.");
      setScanning(false);
    }
  }

  async function scanFrame() {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        onScan(barcodes[0].rawValue);
        stopScanner();
        onOpenChange(false);
        return;
      }
    } catch {}
    animRef.current = requestAnimationFrame(scanFrame);
  }

  function scanCanvasFallback() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const interval = setInterval(async () => {
      if (!video || video.paused || video.ended) {
        clearInterval(interval);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Try BarcodeDetector on canvas
      if ("BarcodeDetector" in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const bitmap = await createImageBitmap(canvas);
          const barcodes = await detector.detect(bitmap);
          if (barcodes.length > 0) {
            clearInterval(interval);
            onScan(barcodes[0].rawValue);
            stopScanner();
            onOpenChange(false);
          }
        } catch {}
      }
    }, 500);

    // Store interval for cleanup
    (window as any).__qrInterval = interval;
  }

  async function stopScanner() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if ((window as any).__qrInterval) {
      clearInterval((window as any).__qrInterval);
      (window as any).__qrInterval = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectorRef.current = null;
    setScanning(false);
  }

  async function handleClose() {
    await stopScanner();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" /> Scan QR Barang
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden bg-black aspect-square relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {!scanning && !error && (
              <div className="absolute inset-0 grid place-items-center bg-black/60">
                <Button onClick={startScanner} className="gap-2">
                  <Camera className="h-4 w-4" /> Nyalakan Kamera
                </Button>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 grid place-items-center p-4 bg-black/60">
                <p className="text-sm text-red-400 text-center">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={startScanner}>
                  Coba Lagi
                </Button>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 animate-pulse" />
              </div>
            )}
          </div>

          {scanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Arahkan kamera ke QR code barang...
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            QR code dari kode barang di Daftar Barang.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
