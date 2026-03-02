// app/api/generate-pattern-full/route.js
//
// Igual que /api/generate-pattern pero sin streaming.
// Espera la respuesta completa y la devuelve como JSON.
// Usada por la app Expo (React Native no soporta bien ReadableStream).

import { buildPatternPrompt } from "@/lib/claudePrompts";

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const body = await request.json();
  const prompt = buildPatternPrompt(body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "Error al contactar Claude" }, { status: 500 });
  }

  const data = await response.json();
  const pattern = data.content?.map((b) => b.text || "").join("") || "";

  return Response.json({ pattern });
}
