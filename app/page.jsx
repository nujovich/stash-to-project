"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AUTH_ERRORS = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Por favor confirma tu correo antes de iniciar sesión.",
  "User already registered": "Este correo ya está registrado.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Unable to validate email address: invalid format": "El formato del correo no es válido.",
};

function translateError(msg) {
  for (const [key, val] of Object.entries(AUTH_ERRORS)) {
    if (msg.includes(key)) return val;
  }
  return msg;
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) router.replace("/stash");
    });
  }, [router]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const signInWithGoogle = async () => {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/stash` },
    });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(translateError(error.message));
    else router.replace("/stash");
    setLoading(false);
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(translateError(error.message));
    } else {
      setSuccess("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "calc(100vh - var(--nav-height))",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--paper)", padding: 24,
    }}>
      <div style={{
        background: "var(--white)", border: "1.5px solid var(--border)",
        borderRadius: 24, padding: "48px 40px", maxWidth: 420, width: "100%",
        textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🧶</div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 38, fontWeight: 600, color: "var(--ink)",
          lineHeight: 1.1, marginBottom: 12,
        }}>
          Stash <em style={{ fontStyle: "italic", color: "var(--rust)" }}>to</em> Project
        </h1>

        <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
          Registra tus hilos, genera patrones personalizados y gestiona tus proyectos de crochet con inteligencia artificial.
        </p>

        {/* Features */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12, marginBottom: 28,
        }}>
          {[
            { icon: "🧶", label: "Gestiona tu stash" },
            { icon: "✦", label: "Genera patrones" },
            { icon: "📐", label: "Perfiles de talla" },
          ].map(f => (
            <div key={f.label} style={{
              background: "var(--paper)", borderRadius: 10,
              padding: "12px 8px", fontSize: 12,
              color: "var(--muted)", fontWeight: 500,
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              {f.label}
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "var(--paper)",
          borderRadius: 10, padding: 4, marginBottom: 24,
        }}>
          {[
            { key: "login", label: "Iniciar sesión" },
            { key: "register", label: "Registrarse" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => switchMode(tab.key)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13,
                fontWeight: 500, fontFamily: "inherit", border: "none",
                background: mode === tab.key ? "var(--white)" : "transparent",
                color: mode === tab.key ? "var(--ink)" : "var(--muted)",
                boxShadow: mode === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Google OAuth */}
        <button
          onClick={signInWithGoogle}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: "var(--white)", border: "1.5px solid var(--border)",
            color: "var(--ink)", fontFamily: "inherit", transition: "all 0.15s",
            width: "100%", marginBottom: 16,
          }}
        >
          <GoogleIcon /> Continuar con Google
        </button>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>o con tu correo</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Feedback messages */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            fontSize: 13, color: "#B91C1C", textAlign: "left",
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            fontSize: 13, color: "#15803D", textAlign: "left",
          }}>
            {success}
          </div>
        )}

        {/* Email form — Login */}
        {mode === "login" && !success && (
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>
        )}

        {/* Email form — Register */}
        {mode === "register" && !success && (
          <form onSubmit={handleEmailRegister} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Registrando…" : "Crear cuenta"}
            </button>
          </form>
        )}

        {/* After successful registration */}
        {mode === "register" && success && (
          <button onClick={() => switchMode("login")} style={primaryBtnStyle(false)}>
            Ir a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "11px 14px", borderRadius: 10, fontSize: 14,
  border: "1.5px solid var(--border)", background: "var(--paper)",
  color: "var(--ink)", fontFamily: "inherit", outline: "none",
  width: "100%",
};

const primaryBtnStyle = (disabled) => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 500,
  background: disabled ? "var(--border)" : "var(--rust)",
  border: "none", color: "white", fontFamily: "inherit",
  transition: "all 0.15s", width: "100%",
  opacity: disabled ? 0.7 : 1,
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
