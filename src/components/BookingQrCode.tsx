'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BookingQrCodeProps {
  bookingId: string;
  reference: string;
}

export function BookingQrCode({ bookingId, reference }: BookingQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : '';
    const payload = origin
      ? `${origin}/reservation/${bookingId}`
      : `/reservation/${bookingId}`;

    let cancelled = false;
    QRCode.toCanvas(
      canvas,
      payload,
      {
        width: 224,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#16231b',
          light: '#ffffff',
        },
      },
      () => {
        if (cancelled) return;
      }
    );

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <div className="bg-white p-1.5 rounded-xl border border-[#16231b]/12 shrink-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Code QR de vérification pour la réservation ${reference}`}
        className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] block"
      />
    </div>
  );
}
