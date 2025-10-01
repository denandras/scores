export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: 'auto', background: '#fafafa' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.75rem 1rem', fontSize: 12, color: '#6b7280' }}>
        <span>© {new Date().getFullYear()} Scores</span>
      </div>
    </footer>
  );
}
