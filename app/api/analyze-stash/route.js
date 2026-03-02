import { buildStashAnalysisPrompt } from "@/lib/claudePrompts";

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const { yarns, skillLevel } = await request.json();

  if (!yarns || yarns.length === 0) {
    return Response.json({ error: "No hay hilos en el stash" }, { status: 400 });
  }

  const prompt = buildStashAnalysisPrompt({ yarns, skillLevel });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "Error al contactar Claude" }, { status: 500 });
  }

  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Error al parsear respuesta de Claude" }, { status: 500 });
  }
}
