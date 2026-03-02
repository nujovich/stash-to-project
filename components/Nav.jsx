"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/stash",    label: "Mi Stash",   emoji: "🧶" },
  { href: "/patrones", label: "Patrones",   emoji: "✦"  },
  { href: "/perfiles", label: "Tallas",     emoji: "📐" },
];

export default function Nav() {
  const [session, setSession] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const avatar = session?.user?.user_metadata?.avatar_url;
  const displayName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: "var(--nav-height)", background: "var(--white)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: "8px",
    }}>
      {/* Brand */}
      <Link href="/" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, fontWeight: 600, color: "var(--ink)",
        marginRight: 24, whiteSpace: "nowrap",
      }}>
        Stash <em style={{ fontStyle: "italic", color: "var(--rust)" }}>to</em> Project
      </Link>

      {/* Links */}
      {session && NAV_LINKS.map(link => (
        <Link key={link.href} href={link.href} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          color: pathname.startsWith(link.href) ? "var(--rust)" : "var(--muted)",
          background: pathname.startsWith(link.href) ? "var(--rust-bg)" : "transparent",
          transition: "all 0.15s",
        }}>
          <span style={{ fontSize: 14 }}>{link.emoji}</span>
          {link.label}
        </Link>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User */}
      {session ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {avatar ? (
            <img src={avatar} alt={displayName} style={{
              width: 30, height: 30, borderRadius: "50%",
              border: "1.5px solid var(--border)", objectFit: "cover",
            }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--cream)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 600, color: "var(--muted)",
            }}>
              {displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{displayName}</span>
          <button
            onClick={signOut}
            style={{
              fontSize: 12, color: "var(--muted)", background: "none",
              border: "1px solid var(--border)", borderRadius: 6,
              padding: "4px 10px", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            Salir
          </button>
        </div>
      ) : (
        <Link href="/login" style={{
          padding: "7px 16px", background: "var(--rust)", color: "white",
          borderRadius: 8, fontSize: 13, fontWeight: 600,
        }}>
          Iniciar sesión
        </Link>
      )}
    </nav>
  );
}
