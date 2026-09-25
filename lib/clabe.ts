// Validación de CLABE (Clave Bancaria Estandarizada, 18 dígitos)
const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];

export function validateClabe(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(clabe[i]) * WEIGHTS[i]) % 10;
  }
  const control = (10 - (sum % 10)) % 10;
  return control === parseInt(clabe[17]);
}

export function clabeError(clabe: string): string | null {
  if (!/^\d{18}$/.test(clabe)) return "La CLABE debe tener exactamente 18 dígitos numéricos.";
  if (!validateClabe(clabe)) return "Dígito verificador incorrecto. Revisa tu CLABE.";
  return null;
}
