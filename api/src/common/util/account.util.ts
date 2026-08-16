const VN_COUNTRY_CODE = '84';

export function normalizePhone(raw: string): string | null {
  // bỏ khoảng trắng và các ký tự phân tách thường gặp
  const cleaned = raw.replace(/[\s.\-()]/g, '');

  // phần thuê bao gồm 9 chữ số, không bắt đầu bằng 0
  const subscriber = /^(?:\+?84|0)([1-9]\d{8})$/.exec(cleaned)?.[1];
  if (!subscriber) {
    return null;
  }

  return `+${VN_COUNTRY_CODE}${subscriber}`;
}

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/;

export const PASSWORD_REGEX_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, digit, and special character.';

/** Cost của bcrypt. Mọi nơi băm mật khẩu phải dùng chung giá trị này. */
export const BCRYPT_ROUNDS = 10;
