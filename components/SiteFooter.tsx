export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #ead5bc', marginTop: 'auto', background: 'linear-gradient(180deg, rgba(255,247,236,0.88), rgba(255,239,220,0.95))' }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0.75rem 1rem',
        fontSize: 12,
        color: '#7a6753',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span>© {new Date().getFullYear()} The Brass Score Library</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true" style={{
            display: 'inline-block',
            transformOrigin: 'center',
            animation: 'tbsl-heart 1.6s ease-in-out infinite',
          }}>❤️</span>
          <span>Made with love</span>
        </span>
      </div>
      <style>{`
        @keyframes tbsl-heart {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.08); }
          20% { transform: scale(1); }
          30% { transform: scale(1.08); }
          40% { transform: scale(1); }
        }
      `}</style>
    </footer>
  );
}
