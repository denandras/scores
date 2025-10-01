export const metadata = {
  title: 'Terms of Use — TBSL',
};

import { styles, theme } from "@/components/ui/theme";

export default function TermsPage() {
  return (
    <main style={{ padding: '2rem 0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <section style={{
          ...styles.card,
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.md,
          padding: '1.25rem',
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Terms of Use</h1>
          <div style={{ marginTop: 12, color: theme.color.text }}>
            <p style={{ marginTop: 8 }}>
              This website cannot be used for purposes beyond academic goals. The necessity of purchasing available sheet music is informed by the laws of the respective country, and merely having the score as a pdf does not authorize the User to also have the performance rights.
            </p>
            <p style={{ marginTop: 8 }}>
              By using the website, the User consents to the use of their email address for marketing purposes (where the data is not accessible to anyone other than the Administrator).
            </p>
            <p style={{ marginTop: 8 }}>
              The Administrator does not take responsibility for materials downloaded by the User.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
