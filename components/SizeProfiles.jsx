"use client";
// size-profiles.jsx
// Gestor de perfiles de talla + integración con generador de patrones
// Requiere: lib/supabase.js configurado

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Constantes ───────────────────────────────────────────────────────────────

const AVATAR_EMOJIS = ["🧍","👩","👨","👧","👦","👶","🧓","👵","🧑","💃","🕺","🐣"];

const RELATION_OPTIONS = [
  "Para mí", "Regalo", "Encargo / Cliente", "Bebé", "Niña/Niño",
  "Mamá", "Papá", "Pareja", "Amiga/Amigo", "Abuela/Abuelo", "Otro"
];

const SIZE_STANDARDS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla única", "Bebé 0-3m", "Bebé 3-6m", "Bebé 6-12m", "Talla 1", "Talla 2", "Talla 4", "Talla 6", "Talla 8"];

const MEASUREMENT_FIELDS = [
  { key: "chest",           label: "Contorno de pecho",      unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "waist",           label: "Contorno de cintura",    unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "hips",            label: "Contorno de caderas",    unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "shoulder_width",  label: "Ancho de hombros",       unit: "cm", icon: "↔", group: "cuerpo" },
  { key: "torso_length",    label: "Largo de torso",         unit: "cm", icon: "↕", group: "cuerpo" },
  { key: "arm_length",      label: "Largo de brazo",         unit: "cm", icon: "↕", group: "cuerpo" },
  { key: "wrist",           label: "Contorno de muñeca",     unit: "cm", icon: "◎", group: "cuerpo" },
  { key: "head",            label: "Contorno de cabeza",     unit: "cm", icon: "◎", group: "accesorios" },
  { key: "foot_length",     label: "Largo del pie",          unit: "cm", icon: "↔", group: "accesorios" },
  { key: "height",          label: "Altura total",           unit: "cm", icon: "↕", group: "general" },
];

const EMPTY_PROFILE = {
  name: "", relation: "Para mí", avatar_emoji: "🧍",
  size_standard: "", size_shoes: "", size_hat: "", notes: "",
  chest: "", waist: "", hips: "", head: "", shoulder_width: "",
  arm_length: "", torso_length: "", wrist: "", foot_length: "", height: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileToMeasurementString(profile) {
  if (!profile) return "";
  const parts = [];
  if (profile.size_standard) parts.push(`Talla estándar: ${profile.size_standard}`);
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
  if (profile.size_hat)       parts.push(`Gorro: ${profile.size_hat}`);
  if (profile.size_shoes)     parts.push(`Zapatos: ${profile.size_shoes}`);
  if (profile.notes)          parts.push(`Nota: ${profile.notes}`);
  return parts.join(", ");
}

function countMeasurements(profile) {
  return MEASUREMENT_FIELDS.filter(f => profile[f.key]).length;
}

// ─── ProfileCard ─────────────────────────────────────────────────────────────

function ProfileCard({ profile, selected, onSelect, onEdit, onDelete }) {
  const filled = countMeasurements(profile);
  return (
    <div className={`profile-card ${selected ? "selected" : ""}`} onClick={onSelect}>
      <div className="profile-card-top">
        <div className="profile-avatar">{profile.avatar_emoji}</div>
        <div className="profile-card-info">
          <div className="profile-card-name">{profile.name}</div>
          <div className="profile-card-relation">{profile.relation}</div>
        </div>
        <div className="profile-card-actions" onClick={e => e.stopPropagation()}>
          <button className="icon-btn" onClick={onEdit} title="Editar">✏️</button>
          <button className="icon-btn danger" onClick={onDelete} title="Eliminar">🗑</button>
        </div>
      </div>
      <div className="profile-card-footer">
        <div className="profile-tags">
          {profile.size_standard && <span className="size-tag">{profile.size_standard}</span>}
          {profile.size_hat && <span className="size-tag">🧢 {profile.size_hat}</span>}
          {profile.size_shoes && <span className="size-tag">👟 {profile.size_shoes}</span>}
        </div>
        <span className="measures-count">{filled} medida{filled !== 1 ? "s" : ""}</span>
      </div>
      {selected && <div className="selected-check">✓</div>}
    </div>
  );
}

// ─── ProfileForm (modal) ──────────────────────────────────────────────────────

function ProfileForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { ...EMPTY_PROFILE });
  const [activeGroup, setActiveGroup] = useState("general");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const groups = [
    { id: "general",    label: "General",    fields: MEASUREMENT_FIELDS.filter(f => f.group === "general") },
    { id: "cuerpo",     label: "Cuerpo",     fields: MEASUREMENT_FIELDS.filter(f => f.group === "cuerpo") },
    { id: "accesorios", label: "Accesorios", fields: MEASUREMENT_FIELDS.filter(f => f.group === "accesorios") },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? "Editar perfil" : "Nuevo perfil de talla"}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Nombre y emoji */}
          <div className="modal-section">
            <div className="avatar-name-row">
              <div className="avatar-picker">
                <div className="avatar-display">{form.avatar_emoji}</div>
                <div className="avatar-options">
                  {AVATAR_EMOJIS.map(e => (
                    <button key={e} className={`avatar-opt ${form.avatar_emoji === e ? "active" : ""}`} onClick={() => set("avatar_emoji", e)}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="name-relation-col">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="pf-input" placeholder="ej: Yo, Mamá, Bebé Lucas..." value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Relación</label>
                  <select className="pf-select" value={form.relation} onChange={e => set("relation", e.target.value)}>
                    {RELATION_OPTIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tallas estándar */}
          <div className="modal-section">
            <div className="modal-section-title">Tallas estándar</div>
            <div className="std-sizes-grid">
              <div className="form-group">
                <label>Talla ropa</label>
                <select className="pf-select" value={form.size_standard} onChange={e => set("size_standard", e.target.value)}>
                  <option value="">— No especificada —</option>
                  {SIZE_STANDARDS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Talla gorro</label>
                <input className="pf-input" placeholder="ej: S/M, 56cm" value={form.size_hat} onChange={e => set("size_hat", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Talla zapatos</label>
                <input className="pf-input" placeholder="ej: 38, 39" value={form.size_shoes} onChange={e => set("size_shoes", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Medidas por grupo */}
          <div className="modal-section">
            <div className="modal-section-title">Medidas exactas (cm)</div>
            <div className="group-tabs">
              {groups.map(g => (
                <button key={g.id} className={`group-tab ${activeGroup === g.id ? "active" : ""}`} onClick={() => setActiveGroup(g.id)}>
                  {g.label}
                  {g.fields.filter(f => form[f.key]).length > 0 && (
                    <span className="group-filled">{g.fields.filter(f => form[f.key]).length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="measures-grid">
              {groups.find(g => g.id === activeGroup)?.fields.map(field => (
                <div key={field.key} className="form-group">
                  <label>
                    <span className="field-icon">{field.icon}</span> {field.label}
                  </label>
                  <div className="input-unit-wrap">
                    <input
                      className="pf-input"
                      type="number"
                      placeholder="—"
                      value={form[field.key]}
                      onChange={e => set(field.key, e.target.value)}
                    />
                    <span className="input-unit">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="modal-section">
            <div className="modal-section-title">Notas adicionales</div>
            <textarea
              className="pf-textarea"
              placeholder="ej: prefiere mangas largas, tiene los hombros más anchos, es zurda..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="pf-cancel-btn" onClick={onCancel}>Cancelar</button>
          <button className="pf-save-btn" onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SizeProfileSelector (para usar dentro del generador) ─────────────────────

export function SizeProfileSelector({ userId, onSelect, selectedId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const loadProfiles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("size_profiles").select("*").order("created_at");
    if (data) setProfiles(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const saveProfile = async (form) => {
    const payload = {
      ...form,
      user_id: userId,
      chest: form.chest || null, waist: form.waist || null, hips: form.hips || null,
      head: form.head || null, shoulder_width: form.shoulder_width || null,
      arm_length: form.arm_length || null, torso_length: form.torso_length || null,
      wrist: form.wrist || null, foot_length: form.foot_length || null,
      height: form.height || null,
    };
    if (editingProfile) {
      const { data } = await supabase.from("size_profiles").update(payload).eq("id", editingProfile.id).select().single();
      if (data) setProfiles(prev => prev.map(p => p.id === data.id ? data : p));
    } else {
      const { data } = await supabase.from("size_profiles").insert(payload).select().single();
      if (data) setProfiles(prev => [...prev, data]);
    }
    setShowForm(false);
    setEditingProfile(null);
  };

  const deleteProfile = async (id) => {
    if (!confirm("¿Eliminar este perfil?")) return;
    await supabase.from("size_profiles").delete().eq("id", id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) onSelect(null);
  };

  return (
    <>
      <div className="sps-container">
        <div className="sps-header">
          <span className="sps-label">¿Para quién es el proyecto?</span>
          <button className="sps-add-btn" onClick={() => { setEditingProfile(null); setShowForm(true); }}>
            + Nuevo perfil
          </button>
        </div>

        {loading ? (
          <div className="sps-loading">Cargando perfiles...</div>
        ) : profiles.length === 0 ? (
          <div className="sps-empty" onClick={() => setShowForm(true)}>
            <span className="sps-empty-icon">👤</span>
            <span>Crea tu primer perfil de talla</span>
          </div>
        ) : (
          <div className="sps-list">
            {/* Opción: sin perfil */}
            <div className={`sps-none-btn ${!selectedId ? "active" : ""}`} onClick={() => onSelect(null)}>
              <span>✏️ Ingresar medidas manualmente</span>
            </div>
            {profiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                selected={selectedId === p.id}
                onSelect={() => onSelect(p)}
                onEdit={() => { setEditingProfile(p); setShowForm(true); }}
                onDelete={() => deleteProfile(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProfileForm
          initial={editingProfile}
          onSave={saveProfile}
          onCancel={() => { setShowForm(false); setEditingProfile(null); }}
        />
      )}
    </>
  );
}

// ─── SizeProfilesPage (página independiente) ─────────────────────────────────

export default function SizeProfilesPage() {
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  const loadProfiles = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase.from("size_profiles").select("*").order("created_at");
    if (data) setProfiles(data);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const saveProfile = async (form) => {
    const payload = {
      ...form,
      user_id: session.user.id,
      chest: form.chest || null, waist: form.waist || null, hips: form.hips || null,
      head: form.head || null, shoulder_width: form.shoulder_width || null,
      arm_length: form.arm_length || null, torso_length: form.torso_length || null,
      wrist: form.wrist || null, foot_length: form.foot_length || null,
      height: form.height || null,
    };
    if (editingProfile) {
      const { data } = await supabase.from("size_profiles").update(payload).eq("id", editingProfile.id).select().single();
      if (data) { setProfiles(prev => prev.map(p => p.id === data.id ? data : p)); setSelectedPreview(data); }
    } else {
      const { data } = await supabase.from("size_profiles").insert(payload).select().single();
      if (data) { setProfiles(prev => [...prev, data]); setSelectedPreview(data); }
    }
    setShowForm(false);
    setEditingProfile(null);
  };

  const deleteProfile = async (id) => {
    if (!confirm("¿Eliminar este perfil?")) return;
    await supabase.from("size_profiles").delete().eq("id", id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (selectedPreview?.id === id) setSelectedPreview(null);
  };

  const previewProfile = selectedPreview;
  const filledFields = previewProfile ? MEASUREMENT_FIELDS.filter(f => previewProfile[f.key]) : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        :root {
          --ink: #12100E; --paper: #F7F3EC; --cream: #EDE8DE;
          --rust: #B85C38; --rust-light: #D4795A; --muted: #7A736A;
          --border: #DDD8CE; --white: #FDFAF6; --green: #5A8A6A;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--paper); font-family: 'Outfit', sans-serif; color: var(--ink); }

        /* ── Page layout ── */
        .sp-page { max-width: 1100px; margin: 0 auto; padding: 40px 28px 80px; }
        .sp-topbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .sp-title { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; line-height: 1.1; }
        .sp-title em { font-style: italic; color: var(--rust); }
        .sp-sub { font-size: 13px; color: var(--muted); margin-top: 6px; }
        .sp-new-btn { display: flex; align-items: center; gap: 8px; background: var(--rust); color: white; border: none; border-radius: 10px; padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background 0.2s; white-space: nowrap; }
        .sp-new-btn:hover { background: #A34E30; }

        /* ── Content grid ── */
        .sp-grid { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }

        /* ── Profile grid ── */
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
        .empty-profiles { text-align: center; padding: 60px 20px; color: var(--muted); background: var(--white); border: 1.5px dashed var(--border); border-radius: 16px; cursor: pointer; transition: border-color 0.2s; }
        .empty-profiles:hover { border-color: var(--rust-light); }
        .empty-profiles-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
        .empty-profiles p { font-size: 14px; }

        /* ── Profile card ── */
        .profile-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.15s; position: relative; }
        .profile-card:hover { border-color: var(--rust-light); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .profile-card.selected { border-color: var(--rust); background: #FDF6F3; box-shadow: 0 0 0 3px rgba(184,92,56,0.1); }
        .profile-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .profile-avatar { font-size: 32px; flex-shrink: 0; }
        .profile-card-info { flex: 1; min-width: 0; }
        .profile-card-name { font-size: 15px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .profile-card-relation { font-size: 12px; color: var(--muted); }
        .profile-card-actions { display: flex; gap: 4px; }
        .icon-btn { background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 6px; font-size: 14px; opacity: 0.6; transition: opacity 0.15s, background 0.15s; }
        .icon-btn:hover { opacity: 1; background: var(--cream); }
        .icon-btn.danger:hover { background: #FEE8E4; }
        .profile-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .profile-tags { display: flex; gap: 5px; flex-wrap: wrap; }
        .size-tag { font-size: 11px; font-weight: 600; color: var(--rust); background: #FDF3EF; border: 1px solid #F0C8B8; border-radius: 4px; padding: 2px 7px; }
        .measures-count { font-size: 11px; color: var(--muted); }
        .selected-check { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; background: var(--rust); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

        /* ── Preview panel ── */
        .preview-panel { background: var(--white); border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; position: sticky; top: 20px; }
        .preview-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 14px; }
        .preview-avatar { font-size: 40px; }
        .preview-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--ink); }
        .preview-relation { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .preview-body { padding: 16px 20px; }
        .preview-section { margin-bottom: 16px; }
        .preview-section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .preview-std-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .preview-std-tag { font-size: 12px; font-weight: 600; color: var(--rust); background: #FDF3EF; border: 1px solid #F0C8B8; border-radius: 6px; padding: 4px 10px; }
        .measures-table { width: 100%; border-collapse: collapse; }
        .measures-table tr { border-bottom: 1px solid var(--cream); }
        .measures-table tr:last-child { border-bottom: none; }
        .measures-table td { padding: 6px 4px; font-size: 13px; }
        .measures-table td:first-child { color: var(--muted); }
        .measures-table td:last-child { font-weight: 600; color: var(--ink); text-align: right; }
        .preview-notes { font-size: 13px; color: var(--muted); font-style: italic; line-height: 1.5; }
        .preview-empty { padding: 40px 20px; text-align: center; }
        .preview-empty-icon { font-size: 36px; opacity: 0.3; margin-bottom: 10px; }
        .preview-empty-text { font-size: 13px; color: var(--muted); }
        .use-in-pattern-btn { display: block; width: calc(100% - 32px); margin: 0 16px 16px; background: var(--rust); color: white; border: none; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background 0.2s; }
        .use-in-pattern-btn:hover { background: #A34E30; }

        /* ── Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(18,16,14,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: var(--white); border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.2); animation: modalIn 0.2s ease; }
        @keyframes modalIn { from { opacity:0; transform: scale(0.96) translateY(12px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: var(--ink); }
        .modal-close { background: none; border: none; font-size: 24px; color: var(--muted); cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.15s; }
        .modal-close:hover { color: var(--ink); }
        .modal-body { overflow-y: auto; padding: 20px 24px; flex: 1; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; background: var(--white); }
        .pf-cancel-btn { padding: 10px 18px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; background: var(--paper); color: var(--muted); font-family: 'Outfit', sans-serif; }
        .pf-cancel-btn:hover { border-color: var(--muted); }
        .pf-save-btn { padding: 10px 22px; background: var(--rust); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background 0.15s; }
        .pf-save-btn:hover:not(:disabled) { background: #A34E30; }
        .pf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Modal form sections ── */
        .modal-section { margin-bottom: 24px; }
        .modal-section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
        .avatar-name-row { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start; }
        .avatar-picker { display: flex; flex-direction: column; gap: 8px; }
        .avatar-display { font-size: 48px; text-align: center; }
        .avatar-options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .avatar-opt { background: none; border: 1.5px solid var(--border); border-radius: 6px; font-size: 16px; cursor: pointer; padding: 3px; transition: border-color 0.15s; }
        .avatar-opt.active { border-color: var(--rust); background: #FDF3EF; }
        .name-relation-col { display: flex; flex-direction: column; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-group label { font-size: 11px; font-weight: 500; color: var(--muted); display: flex; align-items: center; gap: 5px; }
        .field-icon { font-style: normal; color: var(--rust); font-size: 12px; }
        .pf-input, .pf-select, .pf-textarea { border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 11px; font-size: 13px; font-family: 'Outfit', sans-serif; color: var(--ink); background: var(--paper); outline: none; transition: border-color 0.2s; width: 100%; }
        .pf-input:focus, .pf-select:focus, .pf-textarea:focus { border-color: var(--rust); background: var(--white); }
        .pf-textarea { resize: vertical; min-height: 70px; }
        .std-sizes-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .group-tabs { display: flex; gap: 6px; margin-bottom: 14px; }
        .group-tab { padding: 6px 14px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; background: var(--paper); color: var(--muted); font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 5px; transition: all 0.15s; }
        .group-tab.active { border-color: var(--rust); color: var(--rust); background: #FDF3EF; }
        .group-filled { background: var(--rust); color: white; border-radius: 10px; font-size: 10px; padding: 1px 5px; font-weight: 700; }
        .measures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .input-unit-wrap { position: relative; }
        .input-unit-wrap .pf-input { padding-right: 36px; }
        .input-unit { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--muted); font-weight: 500; pointer-events: none; }

        /* ── SizeProfileSelector (embebido en generador) ── */
        .sps-container { margin-bottom: 20px; }
        .sps-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .sps-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
        .sps-add-btn { font-size: 12px; font-weight: 600; color: var(--rust); background: none; border: 1px solid var(--rust); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
        .sps-add-btn:hover { background: #FDF3EF; }
        .sps-loading { font-size: 13px; color: var(--muted); padding: 10px 0; }
        .sps-empty { display: flex; align-items: center; gap: 8px; padding: 12px; border: 1.5px dashed var(--border); border-radius: 10px; font-size: 13px; color: var(--muted); cursor: pointer; transition: border-color 0.15s; }
        .sps-empty:hover { border-color: var(--rust-light); color: var(--rust); }
        .sps-empty-icon { font-size: 18px; }
        .sps-list { display: flex; flex-direction: column; gap: 7px; max-height: 280px; overflow-y: auto; }
        .sps-none-btn { padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 13px; color: var(--muted); cursor: pointer; background: var(--paper); transition: all 0.15s; }
        .sps-none-btn:hover { border-color: var(--rust-light); }
        .sps-none-btn.active { border-color: var(--rust); color: var(--rust); background: #FDF3EF; }
        .sps-list .profile-card { margin-bottom: 0; }

        @media (max-width: 900px) {
          .sp-grid { grid-template-columns: 1fr; }
          .preview-panel { position: static; }
          .measures-grid { grid-template-columns: 1fr; }
          .std-sizes-grid { grid-template-columns: 1fr 1fr; }
          .avatar-name-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sp-page">
        {/* Top bar */}
        <div className="sp-topbar">
          <div>
            <h1 className="sp-title">Perfiles de <em>talla</em></h1>
            <p className="sp-sub">Guarda medidas para ti y para las personas a quienes regalarás o harás encargos</p>
          </div>
          <button className="sp-new-btn" onClick={() => { setEditingProfile(null); setShowForm(true); }}>
            + Nuevo perfil
          </button>
        </div>

        <div className="sp-grid">
          {/* Lista de perfiles */}
          <div>
            {loading ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando perfiles...</p>
            ) : profiles.length === 0 ? (
              <div className="empty-profiles" onClick={() => setShowForm(true)}>
                <div className="empty-profiles-icon">👤</div>
                <p>Aún no tienes perfiles guardados</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Haz clic para crear el primero</p>
              </div>
            ) : (
              <div className="profile-grid">
                {profiles.map(p => (
                  <ProfileCard
                    key={p.id} profile={p}
                    selected={selectedPreview?.id === p.id}
                    onSelect={() => setSelectedPreview(p)}
                    onEdit={() => { setEditingProfile(p); setShowForm(true); }}
                    onDelete={() => deleteProfile(p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Panel de preview */}
          <div className="preview-panel">
            {previewProfile ? (
              <>
                <div className="preview-header">
                  <div className="preview-avatar">{previewProfile.avatar_emoji}</div>
                  <div>
                    <div className="preview-name">{previewProfile.name}</div>
                    <div className="preview-relation">{previewProfile.relation}</div>
                  </div>
                </div>
                <div className="preview-body">
                  {/* Tallas estándar */}
                  {(previewProfile.size_standard || previewProfile.size_hat || previewProfile.size_shoes) && (
                    <div className="preview-section">
                      <div className="preview-section-label">Tallas estándar</div>
                      <div className="preview-std-tags">
                        {previewProfile.size_standard && <span className="preview-std-tag">Ropa: {previewProfile.size_standard}</span>}
                        {previewProfile.size_hat && <span className="preview-std-tag">🧢 {previewProfile.size_hat}</span>}
                        {previewProfile.size_shoes && <span className="preview-std-tag">👟 {previewProfile.size_shoes}</span>}
                      </div>
                    </div>
                  )}
                  {/* Medidas */}
                  {filledFields.length > 0 && (
                    <div className="preview-section">
                      <div className="preview-section-label">Medidas ({filledFields.length})</div>
                      <table className="measures-table">
                        <tbody>
                          {filledFields.map(f => (
                            <tr key={f.key}>
                              <td>{f.label}</td>
                              <td>{previewProfile[f.key]} {f.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Notas */}
                  {previewProfile.notes && (
                    <div className="preview-section">
                      <div className="preview-section-label">Notas</div>
                      <p className="preview-notes">{previewProfile.notes}</p>
                    </div>
                  )}
                </div>
                <button className="use-in-pattern-btn">
                  Usar en generador de patrones →
                </button>
              </>
            ) : (
              <div className="preview-empty">
                <div className="preview-empty-icon">👆</div>
                <p className="preview-empty-text">Selecciona un perfil para ver sus medidas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <ProfileForm
          initial={editingProfile}
          onSave={saveProfile}
          onCancel={() => { setShowForm(false); setEditingProfile(null); }}
        />
      )}
    </>
  );
}
