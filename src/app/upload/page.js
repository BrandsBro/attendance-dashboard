'use client'

import { useAttendanceData } from '@/hooks/useAttendanceData'
import Sidebar               from '@/components/Sidebar'
import UploadSection         from '@/components/UploadSection'

export default function UploadPage() {
  const { summary, status, errorMsg, processFile, processSheetUrl, clearData } = useAttendanceData()
  const loading = status === 'loading'

  return (
    <div className="app-shell">
      <Sidebar active="upload" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Upload Data</div>
            <div className="topbar-sub">Upload XLS, XLSX or CSV — or connect a Google Sheet</div>
          </div>
          {summary && (
            <div className="topbar-right">
              <button className="btn btn-danger" onClick={clearData}>Clear Data</button>
            </div>
          )}
        </div>
        <div className="page-body">
          <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <UploadSection onFile={processFile} onSheetUrl={processSheetUrl} loading={loading} />
            {loading && <div className="loading-banner">Processing…</div>}
            {status === 'error' && <div className="error-banner">{errorMsg}</div>}
            {summary && (
              <div className="card">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>✓ Data loaded</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {summary.employees.length} employees · {summary.dateRange.from} → {summary.dateRange.to}
                    </div>
                  </div>
                  <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>View Dashboard</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
