'use client'

export default function LoadingScreen({ message = 'Loading from Google Sheets…' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
        {message}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
        Brands Bro LLC · HR Dashboard
      </div>
    </div>
  )
}
