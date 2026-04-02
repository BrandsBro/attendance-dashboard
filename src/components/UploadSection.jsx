'use client'

import { useState, useRef } from 'react'

export default function UploadSection({ onFile, onSheetUrl, loading }) {
  const [tab, setTab]         = useState('file')
  const [url, setUrl]         = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFiles(files) {
    if (!files || files.length === 0) return
    onFile(files[0])
  }

  return (
    <div className="card">
      <h2 className="section-title">Load Attendance Data</h2>

      <div className="tabs">
        <button className={`tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>
          Upload File
        </button>
        <button className={`tab ${tab === 'sheets' ? 'active' : ''}`} onClick={() => setTab('sheets')}>
          Google Sheets
        </button>
      </div>

      {tab === 'file' && (
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          <div className="drop-icon">📂</div>
          <p className="drop-label">{loading ? 'Processing…' : 'Click or drag to upload'}</p>
          <p className="drop-hint">Supports .xls · .xlsx · .csv</p>
        </div>
      )}

      {tab === 'sheets' && (
        <div className="sheets-input-wrap">
          <p className="sheets-hint">
            Make your sheet public (Share → Anyone with the link → Viewer), then paste the URL.
          </p>
          <input
            type="url"
            className="text-input"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={loading || !url.trim()}
            onClick={() => onSheetUrl(url.trim())}
          >
            {loading ? 'Fetching…' : 'Load Sheet'}
          </button>
        </div>
      )}
    </div>
  )
}
