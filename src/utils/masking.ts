/**
 * Che mờ Số điện thoại: 0901234567 -> 090***567
 */
export const maskPhone = (phone?: string | null): string => {
  if (!phone || phone.length < 6) return '***';
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-3);
  return `${prefix}***${suffix}`;
};

/**
 * Che mờ Tên: "Nguyễn Văn A" -> "N*** V*** A" hoặc "Lê Hoàng" -> "L*** H***"
 */
export const maskName = (name?: string | null): string => {
  if (!name) return '***';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word.length > 0 ? `${word[0]}***` : ''))
    .join(' ');
};

/**
 * Che mờ Email: "customer@example.com" -> "c***r@example.com"
 */
export const maskEmail = (email?: string | null): string => {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/**
 * Che mờ Địa chỉ: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM" -> "***, Quận 1, TP.HCM"
 */
export const maskAddress = (address?: string | null): string => {
  if (!address) return '***';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `***, ${parts.slice(1).join(',').trim()}`;
  }
  return '***';
};
