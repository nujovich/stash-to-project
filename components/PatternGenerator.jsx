"use client";
// pattern-generator.jsx
// Generador de patrones de crochet con Claude API (streaming)
// Integra con Supabase para guardar patrones (opcional)
// npm install @supabase/supabase-js

import { useState, useRef, useEffect } from "react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const GARMENT_TYPES = [
  { id: "gorro",       label: "Gorro",          emoji: "🧢" },
  { id: "bufanda",     label: "Bufanda",         emoji: "🧣" },
  { id: "bolso",       label: "Bolso / Tote",    emoji: "👜" },
  { id: "top",         label: "Top / Crop",      emoji: "👗" },
  { id: "cardigan",    label: "Cárdigan",        emoji: "🧥" },
  { id: "amigurumi",   label: "Amigurumi",       emoji: "🧸" },
  { id: "mantel",      label: "Mantel / Posavasos", emoji: "🍽️" },
  { id: "calcetines",  label: "Calcetines",      emoji: "🧦" },
];

const YARN_WEIGHTS = ["Lace", "Fingering", "Sport", "DK", "Worsted", "Bulky", "Super Bulky"];
const SKILL_LEVELS = ["Principiante", "Intermedio", "Avanzado", "Experto"];
const STYLES = ["Clásico", "Moderno / Minimal", "Boho", "Vintage", "Colorblock", "Texturizado"];
const HOOK_SIZES = ["2.0mm", "2.5mm", "3.0mm", "3.5mm", "4.0mm", "4.5mm", "5.0mm", "5.5mm", "6.0mm", "7.0mm", "8.0mm", "9.0mm", "10.0mm"];

const INITIAL_FORM = {
  garment: "gorro",
  yarnWeight: "Worsted",
  yarnFiber: "Lana",
  hookSize: "5.0mm",
  skillLevel: "Intermedio",
  style: "Moderno / Minimal",
  colorCount: "1",
  measurements: "",
  extraNotes: "",
};

// ─── Utilidades ────────────────────────────────────────────────────────────────

function buildPrompt(form) {
  const garment = GARMENT_TYPES.find(g => g.id === form.garment);
  return `Eres una diseñadora experta en crochet. Crea un patrón de crochet COMPLETO y DETALLADO para lo siguiente:

PRENDA: ${garment?.label || form.garment}
HILO: ${form.yarnFiber}, peso ${form.yarnWeight}
GANCHILLO: ${form.hookSize}
NIVEL: ${form.skillLevel}
ESTILO: ${form.style}
COLORES: ${form.colorCount} color(es)
${form.measurements ? `MEDIDAS / TALLA: ${form.measurements}` : ""}
${form.extraNotes ? `NOTAS ADICIONALES: ${form.extraNotes}` : ""}

Escribe el patrón completo usando este formato exacto con estas secciones en orden. Usa los encabezados exactamente como se muestran:

## ${garment?.label || form.garment} — [nombre creativo del patrón]

### Descripción
[2-3 oraciones describiendo la prenda y su estilo]

### Materiales
- Hilo: [especificaciones detalladas y cantidad estimada en gramos/metros]
- Ganchillo: ${form.hookSize}
- [otros materiales necesarios]

### Gauge (Muestra de tensión)
[X] puntos x [Y] vueltas = 10cm x 10cm con punto [nombre]

### Abreviaturas
[lista de todas las abreviaturas usadas en el patrón]

### Tallas y Medidas
[tabla o lista con medidas finales de la prenda]

### Instrucciones

#### [Nombre de la parte 1, ej: "Base / Inicio"]
[instrucciones detalladas vuelta por vuelta o fila por fila, con numeración clara]

#### [Nombre de la parte 2]
[instrucciones...]

[continúa con todas las partes necesarias]

### Armado y Terminaciones
[instrucciones de ensamblaje, rematar hilos, bloqueo]

### Notas del Diseñador
[tips específicos, variaciones sugeridas, cómo personalizar el patrón]

---

IMPORTANTE: 
- Escribe las instrucciones vuelta por vuelta (Vuelta 1, Vuelta 2, etc.) con conteos de puntos exactos entre paréntesis al final de cada vuelta
- Usa abreviaturas estándar en español: pb (punto bajo), pa (punto alto), ppb (punto picot bajo), vp (vuelta de punto), cad (cadena), pp (punto puff), etc.
- El patrón debe ser lo suficientemente detallado para que alguien lo pueda seguir sin experiencia previa en este diseño específico
- Incluye el total de puntos al final de cada vuelta entre paréntesis`;
}

// Parsea el markdown generado en secciones para mostrar bonito
function parsePattern(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) sections.push({ ...currentSection, content: currentContent.join("\n") });
      currentSection = { type: "title", text: line.replace("## ", "").trim() };
      currentContent = [];
    } else if (line.startsWith("### ")) {
      if (currentSection) sections.push({ ...currentSection, content: currentContent.join("\n") });
      currentSection = { type: "section", text: line.replace("### ", "").trim() };
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) sections.push({ ...currentSection, content: currentContent.join("\n") });
  return sections;
}

function renderContent(content) {
  if (!content) return null;
  return content.split("\n").map((line, i) => {
    if (line.startsWith("#### ")) return <h4 key={i} className="subsection-title">{line.replace("#### ", "")}</h4>;
    if (line.startsWith("- ")) return <li key={i} className="pattern-li">{line.replace("- ", "")}</li>;
    if (line.match(/^(Vuelta|Fila|Ronda|Round)\s+\d+/i)) return <p key={i} className="pattern-row"><span className="row-label">{line.split(":")[0]}</span>{line.includes(":") ? ":" + line.split(":").slice(1).join(":") : ""}</p>;
    if (line.trim() === "---") return <hr key={i} className="pattern-divider" />;
    if (line.trim() === "") return <div key={i} className="pattern-spacer" />;
    return <p key={i} className="pattern-text">{line}</p>;
  });
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function PatternGenerator() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [step, setStep] = useState("form"); // form | generating | pattern
  const [streamText, setStreamText] = useState("");
  const [patternText, setPatternText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const streamRef = useRef(null);
  const outputRef = useRef(null);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Auto-scroll durante streaming
  useEffect(() => {
    if (step === "generating" && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamText, step]);

  const generatePattern = async () => {
    setStep("generating");
    setStreamText("");
    setError("");

    try {
      const response = await fetch("/api/generate-pattern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          // En producción usa un proxy /api/generate-pattern para ocultar la key
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          stream: true,
          messages: [{ role: "user", content: buildPrompt(form) }],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.delta?.text || "";
            if (delta) {
              fullText += delta;
              setStreamText(fullText);
            }
          } catch {}
        }
      }

      setPatternText(fullText);
      setStep("pattern");
    } catch (e) {
      setError("Error al generar el patrón. Verifica tu API key o intenta de nuevo.");
      setStep("form");
    }
  };

  const copyPattern = async () => {
    await navigator.clipboard.writeText(patternText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPattern = () => {
    const blob = new Blob([patternText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const garment = GARMENT_TYPES.find(g => g.id === form.garment);
    a.href = url;
    a.download = `patron-${garment?.id || "crochet"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parsed = parsePattern(patternText);
  const garmentObj = GARMENT_TYPES.find(g => g.id === form.garment);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');

        :root {
          --ink: #12100E;
          --paper: #F7F3EC;
          --cream: #EDE8DE;
          --rust: #B85C38;
          --rust-light: #D4795A;
          --muted: #7A736A;
          --border: #DDD8CE;
          --white: #FDFAF6;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--paper); font-family: 'Outfit', sans-serif; color: var(--ink); }

        .pg-app {
          min-height: 100vh;
          background: var(--paper);
        }

        /* ── Top bar ── */
        .pg-topbar {
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--white);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .pg-brand {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: 0.5px;
        }
        .pg-brand em { font-style: italic; color: var(--rust); }
        .pg-topbar-right { font-size: 12px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }

        /* ── Layout ── */
        .pg-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          min-height: calc(100vh - 56px);
        }

        /* ── Sidebar ── */
        .pg-sidebar {
          border-right: 1px solid var(--border);
          padding: 32px 28px;
          overflow-y: auto;
          background: var(--white);
          height: calc(100vh - 56px);
          position: sticky;
          top: 56px;
        }

        .sidebar-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .sidebar-title em { font-style: italic; color: var(--rust); }
        .sidebar-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; line-height: 1.5; }

        .form-section { margin-bottom: 24px; }
        .form-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
          display: block;
        }

        /* Garment grid */
        .garment-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .garment-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          background: var(--paper);
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .garment-btn:hover { border-color: var(--rust-light); background: var(--white); }
        .garment-btn.active { border-color: var(--rust); background: #FDF3EF; }
        .garment-emoji { font-size: 22px; line-height: 1; }
        .garment-label { font-size: 10px; font-weight: 500; color: var(--ink); text-align: center; line-height: 1.2; }

        /* Select / Input */
        .pg-select, .pg-input, .pg-textarea {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
          color: var(--ink);
          background: var(--paper);
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
        }
        .pg-select:focus, .pg-input:focus, .pg-textarea:focus {
          border-color: var(--rust);
          background: var(--white);
        }
        .pg-textarea { resize: vertical; min-height: 72px; line-height: 1.5; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-group label { font-size: 11px; font-weight: 500; color: var(--muted); }

        /* Pill selectors */
        .pill-group { display: flex; flex-wrap: wrap; gap: 7px; }
        .pill-btn {
          padding: 6px 13px;
          border: 1.5px solid var(--border);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: var(--paper);
          color: var(--muted);
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .pill-btn:hover { border-color: var(--rust-light); color: var(--ink); }
        .pill-btn.active { border-color: var(--rust); color: var(--rust); background: #FDF3EF; font-weight: 600; }

        /* Generate button */
        .generate-btn {
          width: 100%;
          background: var(--rust);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s;
          letter-spacing: 0.3px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .generate-btn:hover:not(:disabled) { background: #A34E30; }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .generate-btn .btn-icon { font-size: 18px; }

        .error-msg {
          background: #FEF0ED;
          border: 1.5px solid #F0C0B0;
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          color: var(--rust);
          margin-top: 12px;
        }

        /* ── Main content ── */
        .pg-main {
          padding: 40px 48px;
          overflow-y: auto;
          max-height: calc(100vh - 56px);
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          opacity: 0.6;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-style: italic;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .empty-sub { font-size: 13px; color: var(--muted); }

        /* Streaming state */
        .stream-container {
          max-width: 720px;
        }
        .stream-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .stream-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--rust);
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .stream-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--rust);
        }
        .stream-text {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: var(--ink);
          line-height: 1.8;
          white-space: pre-wrap;
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 28px 32px;
          min-height: 200px;
        }
        .cursor-blink::after {
          content: '▊';
          animation: blink 0.7s step-end infinite;
          color: var(--rust);
          font-size: 14px;
        }
        @keyframes blink { 50% { opacity: 0; } }

        /* Pattern display */
        .pattern-container {
          max-width: 720px;
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pattern-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .pattern-toolbar-left { display: flex; align-items: center; gap: 8px; }
        .toolbar-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--rust);
          background: #FDF3EF;
          border: 1px solid #F0C8B8;
          border-radius: 20px;
          padding: 3px 10px;
        }
        .toolbar-actions { display: flex; gap: 8px; }
        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: var(--white);
          color: var(--muted);
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
        }
        .toolbar-btn:hover { border-color: var(--rust-light); color: var(--ink); }
        .toolbar-btn.primary { background: var(--rust); border-color: var(--rust); color: white; }
        .toolbar-btn.primary:hover { background: #A34E30; }
        .toolbar-btn.success { background: #5A9A7A; border-color: #5A9A7A; color: white; }

        /* Pattern content */
        .pattern-doc {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 48px 56px;
          font-family: 'Outfit', sans-serif;
        }

        .pattern-main-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 2px solid var(--ink);
        }
        .pattern-main-title em {
          font-style: italic;
          color: var(--rust);
          display: block;
          font-size: 46px;
        }
        .pattern-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .pattern-tag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--muted);
          background: var(--cream);
          border-radius: 4px;
          padding: 3px 8px;
        }

        .pattern-section {
          margin-bottom: 32px;
        }
        .pattern-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-number {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: var(--rust);
          background: #FDF3EF;
          border-radius: 4px;
          padding: 2px 7px;
          letter-spacing: 1px;
        }

        .subsection-title {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--rust);
          margin: 20px 0 10px;
        }

        .pattern-text {
          font-size: 14px;
          color: #2A2520;
          line-height: 1.8;
        }

        .pattern-row {
          font-size: 14px;
          color: var(--ink);
          line-height: 1.8;
          padding: 5px 0 5px 14px;
          border-left: 2px solid var(--cream);
          margin: 3px 0;
        }
        .row-label {
          font-weight: 700;
          color: var(--rust);
          margin-right: 4px;
        }

        ul.pattern-list { list-style: none; }
        .pattern-li {
          font-size: 14px;
          color: #2A2520;
          line-height: 1.8;
          padding-left: 16px;
          position: relative;
        }
        .pattern-li::before {
          content: '—';
          position: absolute;
          left: 0;
          color: var(--rust);
          font-weight: 700;
        }

        .pattern-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 24px 0;
        }
        .pattern-spacer { height: 8px; }

        .regenerate-area {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          text-align: center;
        }
        .regenerate-btn {
          font-size: 13px;
          color: var(--muted);
          background: none;
          border: 1.5px dashed var(--border);
          border-radius: 8px;
          padding: 10px 20px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
        }
        .regenerate-btn:hover { border-color: var(--rust); color: var(--rust); }

        @media (max-width: 900px) {
          .pg-layout { grid-template-columns: 1fr; }
          .pg-sidebar { position: static; height: auto; }
          .pg-main { padding: 24px 20px; }
          .pattern-doc { padding: 28px 24px; }
          .garment-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <div className="pg-app">
        {/* Top bar */}
        <div className="pg-topbar">
          <div className="pg-brand">Pattern <em>Studio</em></div>
          <div className="pg-topbar-right">Powered by Claude</div>
        </div>

        <div className="pg-layout">
          {/* ── Sidebar: Formulario ── */}
          <aside className="pg-sidebar">
            <h1 className="sidebar-title">Genera tu <em>patrón</em></h1>
            <p className="sidebar-sub">Describe tu proyecto y Claude creará un patrón completo, paso a paso, adaptado a ti.</p>

            {/* Tipo de prenda */}
            <div className="form-section">
              <span className="form-section-label">¿Qué quieres tejer?</span>
              <div className="garment-grid">
                {GARMENT_TYPES.map(g => (
                  <button key={g.id} className={`garment-btn ${form.garment === g.id ? "active" : ""}`} onClick={() => setField("garment", g.id)}>
                    <span className="garment-emoji">{g.emoji}</span>
                    <span className="garment-label">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hilo y ganchillo */}
            <div className="form-section">
              <span className="form-section-label">Hilo y herramientas</span>
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div className="form-group">
                  <label>Grosor del hilo</label>
                  <select className="pg-select" value={form.yarnWeight} onChange={e => setField("yarnWeight", e.target.value)}>
                    {YARN_WEIGHTS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tamaño ganchillo</label>
                  <select className="pg-select" value={form.hookSize} onChange={e => setField("hookSize", e.target.value)}>
                    {HOOK_SIZES.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Fibra</label>
                <select className="pg-select" value={form.yarnFiber} onChange={e => setField("yarnFiber", e.target.value)}>
                  {["Lana", "Algodón", "Acrílico", "Mezcla lana-acrílico", "Alpaca", "Bambú", "Mohair", "Lino"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Nivel */}
            <div className="form-section">
              <span className="form-section-label">Nivel de dificultad</span>
              <div className="pill-group">
                {SKILL_LEVELS.map(s => (
                  <button key={s} className={`pill-btn ${form.skillLevel === s ? "active" : ""}`} onClick={() => setField("skillLevel", s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Estilo */}
            <div className="form-section">
              <span className="form-section-label">Estilo</span>
              <div className="pill-group">
                {STYLES.map(s => (
                  <button key={s} className={`pill-btn ${form.style === s ? "active" : ""}`} onClick={() => setField("style", s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Colores */}
            <div className="form-section">
              <span className="form-section-label">Número de colores</span>
              <div className="pill-group">
                {["1", "2", "3", "4+"].map(n => (
                  <button key={n} className={`pill-btn ${form.colorCount === n ? "active" : ""}`} onClick={() => setField("colorCount", n)}>{n} color{n !== "1" ? "es" : ""}</button>
                ))}
              </div>
            </div>

            {/* Medidas */}
            <div className="form-section">
              <span className="form-section-label">Medidas / Talla (opcional)</span>
              <input className="pg-input" placeholder="ej: talla M, cabeza 56cm, largo 25cm..." value={form.measurements} onChange={e => setField("measurements", e.target.value)} />
            </div>

            {/* Notas extra */}
            <div className="form-section">
              <span className="form-section-label">Notas adicionales (opcional)</span>
              <textarea className="pg-textarea" placeholder="ej: con bolsillo interior, borde en color contrastante, para bebé..." value={form.extraNotes} onChange={e => setField("extraNotes", e.target.value)} />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button className="generate-btn" onClick={generatePattern} disabled={step === "generating"}>
              <span className="btn-icon">✦</span>
              {step === "generating" ? "Generando patrón..." : "Generar patrón con Claude"}
            </button>
          </aside>

          {/* ── Main: Output ── */}
          <main className="pg-main" ref={outputRef}>
            {/* Estado vacío */}
            {step === "form" && !patternText && (
              <div className="empty-state">
                <div className="empty-icon">{garmentObj?.emoji || "🧶"}</div>
                <p className="empty-title">Tu patrón aparecerá aquí</p>
                <p className="empty-sub">Configura tu proyecto en el panel izquierdo y presiona generar</p>
              </div>
            )}

            {/* Streaming */}
            {step === "generating" && (
              <div className="stream-container">
                <div className="stream-header">
                  <div className="stream-pulse" />
                  <span className="stream-label">Claude está escribiendo tu patrón...</span>
                </div>
                <div className="stream-text cursor-blink">
                  {streamText || "Iniciando..."}
                </div>
              </div>
            )}

            {/* Patrón completo */}
            {step === "pattern" && parsed && (
              <div className="pattern-container">
                {/* Toolbar */}
                <div className="pattern-toolbar">
                  <div className="pattern-toolbar-left">
                    <span className="toolbar-tag">Patrón generado</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{form.skillLevel} · {garmentObj?.label}</span>
                  </div>
                  <div className="toolbar-actions">
                    <button className={`toolbar-btn ${copied ? "success" : ""}`} onClick={copyPattern}>
                      {copied ? "✓ Copiado" : "📋 Copiar"}
                    </button>
                    <button className="toolbar-btn" onClick={downloadPattern}>
                      ↓ Descargar .txt
                    </button>
                    <button className="toolbar-btn primary" onClick={() => { setStep("form"); }}>
                      + Nuevo patrón
                    </button>
                  </div>
                </div>

                {/* Documento del patrón */}
                <div className="pattern-doc">
                  {parsed.map((section, idx) => {
                    if (section.type === "title") {
                      const parts = section.text.split("—");
                      const garmentName = parts[0]?.trim();
                      const patternName = parts[1]?.trim();
                      return (
                        <div key={idx} className="pattern-main-title">
                          {patternName ? <em>{patternName}</em> : null}
                          <div className="pattern-meta" style={{ marginTop: patternName ? 8 : 0 }}>
                            <span className="pattern-tag">{garmentName || garmentObj?.label}</span>
                            <span className="pattern-tag">{form.yarnWeight}</span>
                            <span className="pattern-tag">Ganchillo {form.hookSize}</span>
                            <span className="pattern-tag">{form.skillLevel}</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="pattern-section">
                        <h2 className="pattern-section-title">
                          <span className="section-number">{String(idx).padStart(2, "0")}</span>
                          {section.text}
                        </h2>
                        <div>{renderContent(section.content)}</div>
                      </div>
                    );
                  })}

                  <div className="regenerate-area">
                    <button className="regenerate-btn" onClick={generatePattern}>
                      ↺ Regenerar con las mismas especificaciones
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
