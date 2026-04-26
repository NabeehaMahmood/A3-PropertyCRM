import "./globals.css";

export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          color: 'var(--color-forest)', 
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '0.5rem'
        }}>
          PropertyCRM
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Property Deal Management System
        </p>
      </div>
    </main>
  );
}