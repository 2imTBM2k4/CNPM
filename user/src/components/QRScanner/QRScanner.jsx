import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./QRScanner.css";

const QRScanner = ({ onScan, onClose, expectedQRCode }) => {
  const [error, setError] = useState(null);
  const qrScannerRef = useRef(null);
  const hasScanned = useRef(false);
  const onScanRef = useRef(onScan);
  const expectedQRCodeRef = useRef(expectedQRCode);

  useEffect(() => {
    onScanRef.current = onScan;
    expectedQRCodeRef.current = expectedQRCode;
  }, [onScan, expectedQRCode]);

  useEffect(() => {
    let scanner = null;

    const initScanner = () => {
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        setError("Không tìm thấy element camera. Vui lòng thử lại.");
        return;
      }

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          rememberLastUsedCamera: true,
        },
        false
      );

      qrScannerRef.current = scanner;

      const onScanSuccess = (decodedText) => {
        if (hasScanned.current) return;

        if (decodedText === expectedQRCodeRef.current) {
          hasScanned.current = true;
          scanner.clear().catch(console.error);
          onScanRef.current(decodedText);
        } else {
          setError(`Mã QR không hợp lệ! Mã quét được: ${decodedText.substring(0, 16)}...`);
          setTimeout(() => setError(null), 3000);
        }
      };

      const onScanError = (errorMessage) => {
        if (errorMessage.includes("NotAllowedError")) {
          setError("Quyền truy cập camera bị từ chối.");
        } else if (errorMessage.includes("NotFoundError")) {
          setError("Không tìm thấy camera.");
        }
      };

      try {
        scanner.render(onScanSuccess, onScanError);
      } catch (err) {
        console.error("Error initializing scanner:", err);
        setError("Lỗi khởi tạo camera. Vui lòng thử lại.");
      }
    };

    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(console.error);
        qrScannerRef.current = null;
        hasScanned.current = false;
      }
    };
  }, []);

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h3>📷 Quét mã QR</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qr-scanner-content">
          <div id="qr-reader"></div>
          {error && (
            <div className="qr-scanner-error">
              <p>{error}</p>
            </div>
          )}
          <div className="qr-scanner-instructions">
            <p>Đưa camera vào mã QR để quét</p>
            <p className="qr-scanner-hint">💡 Mã QR cần khớp với mã hiển thị trên màn hình</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
