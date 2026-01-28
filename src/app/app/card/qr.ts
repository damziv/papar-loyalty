import QRCode from "qrcode";

export async function qrDataUrl(value: string) {
  // Medium error correction is a good balance for quick scans.
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });
}
