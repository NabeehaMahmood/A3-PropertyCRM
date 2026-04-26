'use client';

import { getWhatsAppLink, formatPhoneForWhatsApp } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({ phone, message, children }: WhatsAppButtonProps) {
  const handleClick = () => {
    const link = getWhatsAppLink(phone, message);
    window.open(link, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#25D366',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children || 'Chat on WhatsApp'}
    </button>
  );
}

export { getWhatsAppLink, formatPhoneForWhatsApp };