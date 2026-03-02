// Este archivo parchea el fetch en PatternGenerator para usar la API route segura
// El componente PatternGenerator.jsx ya tiene la lógica de streaming.
// Solo necesitas cambiar la URL del fetch de:
//   https://api.anthropic.com/v1/messages
// a:
//   /api/generate-pattern
//
// Esto ya está configurado en app/api/generate-pattern/route.js
// El componente PatternGenerator.jsx llama a /api/generate-pattern automáticamente
// si modificas la línea del fetch. Ver comentario en el componente.
