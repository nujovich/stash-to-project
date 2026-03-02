import "./globals.css";

export const metadata = {
  title: "Stash to Project — Crochet Assistant",
  description: "Registra tus hilos, genera patrones personalizados y gestiona tus proyectos de crochet con IA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}

// ─── Nav component ─────────────────────────────────────────────────────────────
// Importamos el cliente de Supabase solo del lado del cliente
import Nav from "@/components/Nav";
