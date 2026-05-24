'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Something went wrong!</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>A critical error occurred in the application.</p>
          <button 
            onClick={() => reset()}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
