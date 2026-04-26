export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  
  if (digits.startsWith('92') && digits.length === 12) {
    return digits;
  }
  
  if (digits.startsWith('0') && digits.length === 11) {
    return '92' + digits.slice(1);
  }
  
  if (digits.length === 10) {
    return '92' + digits;
  }
  
  return digits;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  let url = `https://wa.me/${formattedPhone}`;
  
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    url += `?text=${encodedMessage}`;
  }
  
  return url;
}

export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 12;
}