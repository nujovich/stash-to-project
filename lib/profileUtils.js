/**
 * Convierte un perfil de talla en un string descriptivo para el prompt de Claude
 */
export function profileToMeasurementString(profile) {
  if (!profile) return "";
  const parts = [];
  if (profile.size_standard)  parts.push(`Talla estándar: ${profile.size_standard}`);
  if (profile.height)         parts.push(`Altura: ${profile.height}cm`);
  if (profile.chest)          parts.push(`Pecho: ${profile.chest}cm`);
  if (profile.waist)          parts.push(`Cintura: ${profile.waist}cm`);
  if (profile.hips)           parts.push(`Caderas: ${profile.hips}cm`);
  if (profile.shoulder_width) parts.push(`Hombros: ${profile.shoulder_width}cm`);
  if (profile.torso_length)   parts.push(`Largo torso: ${profile.torso_length}cm`);
  if (profile.arm_length)     parts.push(`Brazo: ${profile.arm_length}cm`);
  if (profile.wrist)          parts.push(`Muñeca: ${profile.wrist}cm`);
  if (profile.head)           parts.push(`Cabeza: ${profile.head}cm`);
  if (profile.foot_length)    parts.push(`Pie: ${profile.foot_length}cm`);
  if (profile.size_hat)       parts.push(`Talla gorro: ${profile.size_hat}`);
  if (profile.size_shoes)     parts.push(`Zapatos: ${profile.size_shoes}`);
  if (profile.notes)          parts.push(`Nota: ${profile.notes}`);
  return parts.join(", ");
}

export const MEASUREMENT_FIELDS = [
  { key: "chest",          label: "Contorno de pecho",   unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "waist",          label: "Contorno de cintura", unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "hips",           label: "Contorno de caderas", unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "shoulder_width", label: "Ancho de hombros",    unit: "cm", icon: "↔", group: "cuerpo" },
  { key: "torso_length",   label: "Largo de torso",      unit: "cm", icon: "↕", group: "cuerpo" },
  { key: "arm_length",     label: "Largo de brazo",      unit: "cm", icon: "↕", group: "cuerpo" },
  { key: "wrist",          label: "Contorno de muñeca",  unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "head",           label: "Contorno de cabeza",  unit: "cm", icon: "◎", group: "accesorios" },
  { key: "foot_length",    label: "Largo del pie",       unit: "cm", icon: "↔", group: "accesorios" },
  { key: "height",         label: "Altura total",        unit: "cm", icon: "↕", group: "general" },
];
