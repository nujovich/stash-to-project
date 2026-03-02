/**
 * Centraliza todos los prompts que se envían a Claude.
 * Modifica aquí para ajustar el comportamiento de la IA.
 */

export function buildPatternPrompt({ garment, yarnWeight, yarnFiber, hookSize, skillLevel, style, colorCount, measurements, extraNotes }) {
  return `Eres una diseñadora experta en crochet. Crea un patrón de crochet COMPLETO y DETALLADO para lo siguiente:

PRENDA: ${garment}
HILO: ${yarnFiber}, peso ${yarnWeight}
GANCHILLO: ${hookSize}
NIVEL: ${skillLevel}
ESTILO: ${style}
COLORES: ${colorCount} color(es)
${measurements ? `MEDIDAS / TALLA: ${measurements}` : ""}
${extraNotes ? `NOTAS ADICIONALES: ${extraNotes}` : ""}

Escribe el patrón completo usando este formato exacto:

## [Nombre de la prenda] — [nombre creativo del patrón]

### Descripción
[2-3 oraciones describiendo la prenda y su estilo]

### Materiales
- Hilo: [especificaciones detalladas y cantidad estimada en gramos/metros]
- Ganchillo: ${hookSize}
- [otros materiales necesarios]

### Gauge (Muestra de tensión)
[X] puntos x [Y] vueltas = 10cm x 10cm con punto [nombre]

### Abreviaturas
[lista de todas las abreviaturas usadas]

### Tallas y Medidas
[tabla o lista con medidas finales de la prenda]

### Instrucciones

#### [Nombre de la parte 1]
[instrucciones vuelta por vuelta con conteo de puntos entre paréntesis]

### Armado y Terminaciones
[instrucciones de ensamblaje y acabados]

### Notas del Diseñador
[tips y variaciones]

IMPORTANTE:
- Instrucciones vuelta por vuelta con conteos exactos entre paréntesis
- Abreviaturas en español: pb, pa, cad, pp, vp, etc.
- Patrón completo y reproducible sin experiencia previa en este diseño`;
}

export function buildStashAnalysisPrompt({ yarns, skillLevel }) {
  const stashDescription = yarns.map(y =>
    `- ${y.name || y.fiber}: ${y.fiber}, peso ${y.weight}, color ${y.color_name}, ${y.meters}m x ${y.skeins} ovillos = ${y.meters * y.skeins}m totales`
  ).join("\n");

  return `Eres una experta en crochet. Analiza este inventario de hilos y sugiere exactamente 4 proyectos realizables con lo disponible.

STASH DISPONIBLE:
${stashDescription}

NIVEL: ${skillLevel}

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "projects": [
    {
      "emoji": "🧣",
      "name": "Nombre del proyecto",
      "description": "Descripción de 2-3 oraciones",
      "difficulty": "Principiante|Intermedio|Avanzado",
      "estimatedTime": "2-3 semanas",
      "yarnsNeeded": ["Hilo X: 200m en color Crema"],
      "stitches": ["Punto bajo", "Punto alto"],
      "tip": "Consejo específico para este proyecto"
    }
  ]
}`;
}
