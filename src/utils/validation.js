export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 8;
}

export function validatePasswordMatch(password, confirm) {
  return password === confirm;
}

export function validateNumeric(value) {
  return /^\d+$/.test(value);
}

export function getRegisterErrors({ full_name, email, floor, apartment, password, confirmPassword }) {
  const errors = {};
  if (!full_name?.trim()) errors.full_name = 'חובה להזין שם מלא';
  if (!validateEmail(email)) errors.email = 'אימייל לא תקין';
  if (!validateNumeric(floor)) errors.floor = 'קומה חייבת להיות מספר';
  if (!validateNumeric(apartment)) errors.apartment = 'דירה חייבת להיות מספר';
  if (!validatePassword(password)) errors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
  if (!validatePasswordMatch(password, confirmPassword)) errors.confirmPassword = 'הסיסמאות לא תואמות';
  return errors;
}
