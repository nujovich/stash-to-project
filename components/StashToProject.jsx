"use client";
// stash-to-project.jsx
// Dependencias: npm install @supabase/supabase-js
// Requiere: lib/supabase.js con el cliente configurado

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; // ajusta el path según tu proyecto

// ─── Constantes ───────────────────────────────────────────────────────────────

const YARN_WEIGHTS = ["Lace", "Fingering", "Sport", "DK", "Worsted", "Bulky", "Super Bulky"];
const YARN_FIBERS = ["Algodón", "Lana", "Acrílico", "Mezcla", "Bambú", "Alpaca", "Mohair", "Lino"];
const COLORS = [
  { name: "Crema", hex: "#F5F0E8" },
  { name: "Terracota", hex: "#C4704F" },
  { name: "Sage", hex: "#7C9A82" },
  { name: "Marino", hex: "#2C3E6B" },
  { name: "Mostaza", hex: "#D4A832" },
  { name: "Rosado", hex: "#E8A0A0" },
  { name: "Carbón", hex: "#3A3A3A" },
  { name: "Lavanda", hex: "#A89BC2" },
  { name: "Coral", hex: "#E8735A" },
  { name: "Menta", hex: "#A8D5B5" },
  { name: "Camel", hex: "#C4965A" },
  { name: "Blanco", hex: "#FAFAFA" },
];
const SKILL_LEVELS = ["Principiante", "Intermedio", "Avanzado"];
const initialForm = { name: "", weight: "Worsted", fiber: "Algodón", color: COLORS[0], meters: "", skeins: 1 };

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (provider) => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">🧶</div>
        <h2 className="auth-title">Stash <em>to</em> Project</h2>
        <p className="auth-sub">Registra tus hilos y descubre qué puedes crear con ellos</p>
        {error && <div className="error-msg">{error}</div>}
        <button className="oauth-btn google-btn" onClick={() => signIn("google")} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
        <button className="oauth-btn github-btn" onClick={() => signIn("github")} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          Continuar con GitHub
        </button>
        {loading && <p className="auth-loading">Redirigiendo...</p>}
      </div>
    </div>
  );
}

function YarnCard({ yarn, onRemove }) {
  return (
    <div className="yarn-card">
      <div className="yarn-swatch" style={{ background: yarn.color_hex }} />
      <div className="yarn-info">
        <span className="yarn-name">{yarn.name || yarn.fiber}</span>
        <span className="yarn-meta">{yarn.weight} · {yarn.meters}m · {yarn.skeins} ovillo{yarn.skeins > 1 ? "s" : ""}</span>
        <span className="yarn-fiber">{yarn.fiber} · {yarn.color_name}</span>
      </div>
      <button className="remove-btn" onClick={() => onRemove(yarn.id)}>×</button>
    </div>
  );
}

function ProjectCard({ project, index, onSave, onUnsave, saved }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const difficultyColor = { "Principiante": "#7C9A82", "Intermedio": "#D4A832", "Avanzado": "#C4704F" }[project.difficulty] || "#7C9A82";

  const handleSave = async () => {
    setSaving(true);
    if (saved) await onUnsave(project);
    else await onSave(project);
    setSaving(false);
  };

  return (
    <div className={`project-card ${expanded ? "expanded" : ""}`} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="project-header" onClick={() => setExpanded(!expanded)}>
        <div className="project-title-area">
          <span className="project-emoji">{project.emoji}</span>
          <div>
            <h3 className="project-name">{project.name}</h3>
            <span className="project-time">{project.estimatedTime || project.estimated_time}</span>
          </div>
        </div>
        <div className="project-right">
          <span className="difficulty-badge" style={{ color: difficultyColor, borderColor: difficultyColor }}>
            {project.difficulty}
          </span>
          <button
            className={`save-btn ${saved ? "saved" : ""}`}
            onClick={e => { e.stopPropagation(); handleSave(); }}
            disabled={saving}
            title={saved ? "Quitar de favoritos" : "Guardar proyecto"}
          >
            {saved ? "♥" : "♡"}
          </button>
          <span className="expand-arrow">{expanded ? "↑" : "↓"}</span>
        </div>
      </div>
      {expanded && (
        <div className="project-details">
          <p className="project-description">{project.description}</p>
          <div className="project-section">
            <h4>Hilos necesarios</h4>
            <ul>{(project.yarnsNeeded || project.yarns_needed || []).map((y, i) => <li key={i}>{y}</li>)}</ul>
          </div>
          <div className="project-section">
            <h4>Puntos principales</h4>
            <ul>{(project.stitches || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          {project.tip && (
            <div className="project-tip"><span>💡</span> {project.tip}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function StashToProject() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [yarns, setYarns] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [form, setForm] = useState({ ...initialForm });
  const [skillLevel, setSkillLevel] = useState("Intermedio");
  const [generatedProjects, setGeneratedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("stash");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Cargar datos del usuario ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!session) return;
    setDbLoading(true);
    const [{ data: yarnData }, { data: projectData }] = await Promise.all([
      supabase.from("yarns").select("*").order("created_at", { ascending: true }),
      supabase.from("saved_projects").select("*").order("created_at", { ascending: false }),
    ]);
    if (yarnData) setYarns(yarnData);
    if (projectData) setSavedProjects(projectData);
    setDbLoading(false);
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Stash CRUD ─────────────────────────────────────────────────────────────
  const addYarn = async () => {
    if (!form.meters || !session) return;
    const newYarn = {
      user_id: session.user.id,
      name: form.name,
      weight: form.weight,
      fiber: form.fiber,
      color_name: form.color.name,
      color_hex: form.color.hex,
      meters: parseInt(form.meters),
      skeins: form.skeins,
    };
    const { data, error } = await supabase.from("yarns").insert(newYarn).select().single();
    if (!error && data) {
      setYarns(prev => [...prev, data]);
      setForm({ ...initialForm });
    }
  };

  const removeYarn = async (id) => {
    await supabase.from("yarns").delete().eq("id", id);
    setYarns(prev => prev.filter(y => y.id !== id));
  };

  // ── Guardar / quitar proyectos ─────────────────────────────────────────────
  const saveProject = async (project) => {
    const row = {
      user_id: session.user.id,
      emoji: project.emoji,
      name: project.name,
      description: project.description,
      difficulty: project.difficulty,
      estimated_time: project.estimatedTime,
      yarns_needed: project.yarnsNeeded,
      stitches: project.stitches,
      tip: project.tip,
    };
    const { data, error } = await supabase.from("saved_projects").insert(row).select().single();
    if (!error && data) setSavedProjects(prev => [data, ...prev]);
  };

  const unsaveProject = async (project) => {
    // Buscar por nombre ya que los generados no tienen id de DB
    const found = savedProjects.find(p => p.name === project.name);
    if (!found) return;
    await supabase.from("saved_projects").delete().eq("id", found.id);
    setSavedProjects(prev => prev.filter(p => p.id !== found.id));
  };

  const isProjectSaved = (project) => savedProjects.some(p => p.name === project.name);

  // ── Análisis con Claude ────────────────────────────────────────────────────
  const analyzeStash = async () => {
    if (yarns.length === 0) return;
    setLoading(true);
    setError("");
    setGeneratedProjects([]);

    const stashDescription = yarns.map(y =>
      `- ${y.name || y.fiber}: ${y.fiber}, peso ${y.weight}, color ${y.color_name}, ${y.meters}m x ${y.skeins} ovillos = ${y.meters * y.skeins}m totales`
    ).join("\n");

    const prompt = `Eres una experta en crochet. Analiza este inventario de hilos y sugiere exactamente 4 proyectos realizables con lo disponible.

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

    try {
      // En producción, reemplaza esta URL por tu ruta /api/analyze para proteger la API key
      const response = await fetch("/api/analyze-stash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setGeneratedProjects(parsed.projects || []);
      setActiveTab("results");
    } catch (e) {
      setError("Error al analizar el stash. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setYarns([]);
    setSavedProjects([]);
    setGeneratedProjects([]);
  };

  // ── Renders ────────────────────────────────────────────────────────────────
  if (sessionLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#FAF7F2" }}>
      <div className="spinner" />
    </div>
  );

  if (!session) return <AuthScreen />;

  const avatar = session.user.user_metadata?.avatar_url;
  const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF7F2; font-family: 'DM Sans', sans-serif; }

        /* ── Layout ── */
        .app { max-width: 680px; margin: 0 auto; padding: 0 20px 80px; min-height: 100vh; }

        /* ── Header ── */
        .header { padding: 40px 0 28px; display: flex; align-items: flex-start; justify-content: space-between; }
        .header-left {}
        .header-eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #C4704F; font-weight: 500; margin-bottom: 8px; }
        h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 600; color: #1A1714; line-height: 1.1; }
        h1 em { font-style: italic; color: #C4704F; }
        .user-area { display: flex; align-items: center; gap: 10px; padding-top: 8px; }
        .user-avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #E8E2D9; object-fit: cover; }
        .user-initial { width: 36px; height: 36px; border-radius: 50%; background: #E8E2D9; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #6B6560; }
        .signout-btn { font-size: 12px; color: #9A9390; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 4px 0; text-decoration: underline; text-underline-offset: 2px; }
        .signout-btn:hover { color: #C4704F; }

        /* ── Tabs ── */
        .tabs { display: flex; border-bottom: 1.5px solid #E8E2D9; margin-bottom: 28px; }
        .tab { padding: 11px 18px; font-size: 13px; font-weight: 500; color: #9A9390; border-bottom: 2.5px solid transparent; cursor: pointer; margin-bottom: -1.5px; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'DM Sans', sans-serif; }
        .tab.active { color: #1A1714; border-bottom-color: #C4704F; }
        .tab:disabled { opacity: 0.4; cursor: default; }
        .tab-badge { background: #C4704F; color: white; border-radius: 10px; font-size: 10px; padding: 1px 6px; margin-left: 6px; font-weight: 600; }

        /* ── Form ── */
        .section-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9A9390; font-weight: 500; margin-bottom: 14px; }
        .form-card { background: white; border: 1.5px solid #E8E2D9; border-radius: 16px; padding: 22px; margin-bottom: 22px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-group label { font-size: 11px; font-weight: 500; color: #6B6560; letter-spacing: 0.5px; text-transform: uppercase; }
        .form-group input, .form-group select { border: 1.5px solid #E8E2D9; border-radius: 8px; padding: 9px 11px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #1A1714; background: #FAF7F2; outline: none; transition: border-color 0.2s; }
        .form-group input:focus, .form-group select:focus { border-color: #C4704F; background: white; }
        .color-trigger { display: flex; align-items: center; gap: 9px; border: 1.5px solid #E8E2D9; border-radius: 8px; padding: 7px 11px; cursor: pointer; background: #FAF7F2; transition: border-color 0.2s; }
        .color-trigger:hover { border-color: #C4704F; }
        .color-dot { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.1); flex-shrink: 0; }
        .color-name { font-size: 14px; color: #1A1714; }
        .color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; padding: 14px; background: white; border: 1.5px solid #E8E2D9; border-radius: 12px; margin-bottom: 14px; }
        .color-option { width: 34px; height: 34px; border-radius: 50%; cursor: pointer; border: 2.5px solid transparent; transition: transform 0.15s, border-color 0.15s; }
        .color-option:hover { transform: scale(1.15); }
        .color-option.selected { border-color: #C4704F; }
        .meters-row { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 14px; }
        .add-btn { width: 100%; background: #1A1714; color: white; border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s; }
        .add-btn:hover { background: #2D2825; }
        .add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Yarn list ── */
        .yarn-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px; }
        .yarn-card { display: flex; align-items: center; gap: 13px; background: white; border: 1.5px solid #E8E2D9; border-radius: 12px; padding: 13px 15px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .yarn-swatch { width: 38px; height: 38px; border-radius: 8px; border: 1.5px solid rgba(0,0,0,0.08); flex-shrink: 0; }
        .yarn-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .yarn-name { font-size: 14px; font-weight: 500; color: #1A1714; }
        .yarn-meta { font-size: 12px; color: #6B6560; }
        .yarn-fiber { font-size: 12px; color: #9A9390; }
        .remove-btn { background: none; border: none; font-size: 20px; color: #C4B8B0; cursor: pointer; padding: 4px 8px; line-height: 1; transition: color 0.2s; }
        .remove-btn:hover { color: #C4704F; }

        /* ── Skill selector ── */
        .skill-section { margin-bottom: 22px; }
        .skill-buttons { display: flex; gap: 9px; }
        .skill-btn { flex: 1; padding: 9px; border: 1.5px solid #E8E2D9; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; background: white; color: #6B6560; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .skill-btn.active { border-color: #C4704F; color: #C4704F; background: #FDF6F2; }

        /* ── Analyze button ── */
        .analyze-btn { width: 100%; background: #C4704F; color: white; border: none; border-radius: 12px; padding: 17px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s; }
        .analyze-btn:hover:not(:disabled) { background: #B3603F; }
        .analyze-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .analyze-btn .btn-sub { display: block; font-size: 11px; opacity: 0.8; margin-top: 3px; font-weight: 400; }

        /* ── Loading ── */
        .spinner { width: 36px; height: 36px; border: 3px solid #E8E2D9; border-top-color: #C4704F; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state { text-align: center; padding: 60px 20px; }
        .loading-state .spinner { margin: 0 auto 18px; }
        .loading-text { font-family: 'Playfair Display', serif; font-style: italic; font-size: 18px; color: #6B6560; }
        .loading-sub { font-size: 13px; color: #9A9390; margin-top: 8px; }

        /* ── Project cards ── */
        .results-header { margin-bottom: 22px; }
        .results-title { font-family: 'Playfair Display', serif; font-size: 24px; color: #1A1714; margin-bottom: 4px; }
        .results-sub { font-size: 13px; color: #6B6560; }
        .project-card { background: white; border: 1.5px solid #E8E2D9; border-radius: 14px; overflow: hidden; margin-bottom: 10px; animation: fadeIn 0.4s ease both; transition: border-color 0.2s; }
        .project-card:hover { border-color: #C4B8B0; }
        .project-card.expanded { border-color: #C4704F; }
        .project-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; cursor: pointer; }
        .project-title-area { display: flex; align-items: center; gap: 13px; }
        .project-emoji { font-size: 26px; }
        .project-name { font-size: 15px; font-weight: 500; color: #1A1714; margin-bottom: 2px; }
        .project-time { font-size: 12px; color: #9A9390; }
        .project-right { display: flex; align-items: center; gap: 10px; }
        .difficulty-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; border: 1.5px solid; border-radius: 20px; padding: 3px 9px; }
        .save-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #C4B8B0; transition: color 0.2s, transform 0.15s; padding: 2px 4px; line-height: 1; }
        .save-btn:hover { color: #C4704F; transform: scale(1.2); }
        .save-btn.saved { color: #C4704F; }
        .expand-arrow { font-size: 14px; color: #9A9390; }
        .project-details { border-top: 1.5px solid #E8E2D9; padding: 18px; background: #FAF7F2; }
        .project-description { font-size: 14px; color: #4A4440; line-height: 1.6; margin-bottom: 18px; }
        .project-section { margin-bottom: 14px; }
        .project-section h4 { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #9A9390; font-weight: 500; margin-bottom: 7px; }
        .project-section ul { list-style: none; }
        .project-section li { font-size: 13px; color: #4A4440; padding: 3px 0 3px 14px; position: relative; }
        .project-section li::before { content: '—'; position: absolute; left: 0; color: #C4704F; }
        .project-tip { background: white; border: 1.5px solid #E8E2D9; border-radius: 9px; padding: 11px 13px; font-size: 13px; color: #4A4440; line-height: 1.5; display: flex; gap: 9px; }
        .new-analysis-btn { display: block; text-align: center; padding: 12px; font-size: 14px; color: #6B6560; cursor: pointer; border: 1.5px dashed #E8E2D9; border-radius: 10px; background: none; width: 100%; font-family: 'DM Sans', sans-serif; margin-top: 14px; transition: all 0.2s; }
        .new-analysis-btn:hover { border-color: #C4704F; color: #C4704F; }

        /* ── Auth ── */
        .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #FAF7F2; padding: 20px; }
        .auth-card { background: white; border: 1.5px solid #E8E2D9; border-radius: 20px; padding: 40px 32px; max-width: 380px; width: 100%; text-align: center; }
        .auth-icon { font-size: 48px; margin-bottom: 16px; }
        .auth-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 600; color: #1A1714; margin-bottom: 10px; }
        .auth-title em { font-style: italic; color: #C4704F; }
        .auth-sub { font-size: 14px; color: #6B6560; line-height: 1.5; margin-bottom: 28px; }
        .oauth-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 13px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; margin-bottom: 10px; }
        .google-btn { background: white; border: 1.5px solid #E8E2D9; color: #1A1714; }
        .google-btn:hover { border-color: #C4B8B0; background: #FAF7F2; }
        .github-btn { background: #1A1714; border: 1.5px solid #1A1714; color: white; }
        .github-btn:hover { background: #2D2825; }
        .oauth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-loading { font-size: 13px; color: #9A9390; margin-top: 12px; }

        /* ── Misc ── */
        .error-msg { background: #FDF2F0; border: 1.5px solid #E8A090; border-radius: 9px; padding: 12px 14px; font-size: 14px; color: #C4704F; margin-bottom: 18px; }
        .empty-stash { text-align: center; padding: 36px 20px; color: #9A9390; }
        .empty-icon { font-size: 44px; margin-bottom: 10px; }
        .db-loading { opacity: 0.5; pointer-events: none; }
        .section-divider { border: none; border-top: 1.5px solid #E8E2D9; margin: 20px 0; }
        .saved-section-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #1A1714; margin-bottom: 14px; }

        @media (max-width: 480px) {
          h1 { font-size: 28px; }
          .form-grid { grid-template-columns: 1fr; }
          .color-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <div className={`app ${dbLoading ? "db-loading" : ""}`}>
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="header-eyebrow">Crochet Assistant</div>
            <h1>Stash <em>to</em> Project</h1>
          </div>
          <div className="user-area">
            <div style={{ textAlign: "right" }}>
              {avatar
                ? <img src={avatar} alt={displayName} className="user-avatar" />
                : <div className="user-initial">{displayName?.[0]?.toUpperCase()}</div>
              }
              <button className="signout-btn" onClick={signOut}>Salir</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === "stash" ? "active" : ""}`} onClick={() => setActiveTab("stash")}>
            Mi Stash {yarns.length > 0 && <span className="tab-badge">{yarns.length}</span>}
          </button>
          <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")} disabled={generatedProjects.length === 0 && !loading}>
            Sugeridos {generatedProjects.length > 0 && <span className="tab-badge">{generatedProjects.length}</span>}
          </button>
          <button className={`tab ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>
            Favoritos {savedProjects.length > 0 && <span className="tab-badge">{savedProjects.length}</span>}
          </button>
        </div>

        {/* ── TAB: STASH ── */}
        {activeTab === "stash" && (
          <>
            <div className="form-card">
              <div className="section-label">Agregar hilo</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre (opcional)</label>
                  <input type="text" placeholder="ej: Drops Safran" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Fibra</label>
                  <select value={form.fiber} onChange={e => setForm(f => ({ ...f, fiber: e.target.value }))}>
                    {YARN_FIBERS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Grosor</label>
                  <select value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}>
                    {YARN_WEIGHTS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-trigger" onClick={() => setColorPickerOpen(o => !o)}>
                    <div className="color-dot" style={{ background: form.color.hex }} />
                    <span className="color-name">{form.color.name}</span>
                  </div>
                </div>
              </div>
              {colorPickerOpen && (
                <div className="color-grid">
                  {COLORS.map(c => (
                    <div key={c.name} className={`color-option ${form.color.name === c.name ? "selected" : ""}`}
                      style={{ background: c.hex, border: c.hex === "#FAFAFA" ? "2px solid #E8E2D9" : undefined }}
                      title={c.name} onClick={() => { setForm(f => ({ ...f, color: c })); setColorPickerOpen(false); }} />
                  ))}
                </div>
              )}
              <div className="meters-row">
                <div className="form-group">
                  <label>Metros por ovillo</label>
                  <input type="number" placeholder="ej: 200" value={form.meters} onChange={e => setForm(f => ({ ...f, meters: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Nº de ovillos</label>
                  <input type="number" min="1" value={form.skeins} onChange={e => setForm(f => ({ ...f, skeins: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <button className="add-btn" onClick={addYarn} disabled={!form.meters}>+ Agregar al stash</button>
            </div>

            {yarns.length > 0 ? (
              <>
                <div className="section-label">Tu stash ({yarns.length} hilo{yarns.length > 1 ? "s" : ""})</div>
                <div className="yarn-list">
                  {yarns.map(y => <YarnCard key={y.id} yarn={y} onRemove={removeYarn} />)}
                </div>
                <div className="skill-section">
                  <div className="section-label">Tu nivel de crochet</div>
                  <div className="skill-buttons">
                    {SKILL_LEVELS.map(s => (
                      <button key={s} className={`skill-btn ${skillLevel === s ? "active" : ""}`} onClick={() => setSkillLevel(s)}>{s}</button>
                    ))}
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button className="analyze-btn" onClick={analyzeStash} disabled={loading}>
                  {loading ? "Analizando tu stash..." : "Descubrir proyectos con Claude"}
                  <span className="btn-sub">{loading ? "Esto toma unos segundos" : `${yarns.length} hilo${yarns.length > 1 ? "s" : ""} · nivel ${skillLevel.toLowerCase()}`}</span>
                </button>
              </>
            ) : (
              <div className="empty-stash">
                <div className="empty-icon">🧶</div>
                <p>Agrega tus primeros hilos para comenzar</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB: SUGERIDOS ── */}
        {activeTab === "results" && (
          loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p className="loading-text">Analizando tu stash...</p>
              <p className="loading-sub">Claude está buscando los mejores proyectos para tus hilos</p>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2 className="results-title">Proyectos posibles</h2>
                <p className="results-sub">Basado en {yarns.length} hilo{yarns.length > 1 ? "s" : ""} · nivel {skillLevel.toLowerCase()}</p>
              </div>
              {generatedProjects.map((p, i) => (
                <ProjectCard key={i} project={p} index={i}
                  onSave={saveProject} onUnsave={unsaveProject} saved={isProjectSaved(p)} />
              ))}
              <button className="new-analysis-btn" onClick={() => setActiveTab("stash")}>← Modificar stash y analizar de nuevo</button>
            </>
          )
        )}

        {/* ── TAB: FAVORITOS ── */}
        {activeTab === "saved" && (
          <>
            {savedProjects.length > 0 ? (
              <>
                <div className="results-header">
                  <h2 className="results-title">Proyectos guardados</h2>
                  <p className="results-sub">{savedProjects.length} proyecto{savedProjects.length > 1 ? "s" : ""} en favoritos</p>
                </div>
                {savedProjects.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i}
                    onSave={saveProject} onUnsave={unsaveProject} saved={true} />
                ))}
              </>
            ) : (
              <div className="empty-stash">
                <div className="empty-icon">♡</div>
                <p>Aún no tienes proyectos guardados</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Genera proyectos y guarda tus favoritos</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
