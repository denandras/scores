import { styles, theme } from "@/components/ui/theme";

export default function NotFound() {
  return (
    <main style={{ padding: "4rem 0", display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 640, width: '100%', padding: '0 16px', textAlign: 'center' as const }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: 0.2 }}>Page not found</h1>
        <p style={{ marginTop: 8, color: theme.color.muted }}>The page you’re looking for doesn’t exist.</p>
        <div style={{ marginTop: 16 }}>
          <a href="/dashboard" style={{ ...styles.buttonBase, ...styles.buttonGhost }}>🏠 Go Home</a>
        </div>
      </div>
    </main>
  );
}
