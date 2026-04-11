'use client'

import { useState, useRef } from 'react'

export default function UploadSection({ onFile, onSheetUrl, loading }) {
  const [tab,      setTab]      = useState('file')
  const [url,      setUrl]      = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFiles(files) {
    if (!files?.length) return
    onFile(files[0])
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Load Attendance Data</span>
      </div>
      <div className="card-body">
        <div className="tabs">
          <button className={`tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>Upload File</button>
          <button className={`tab ${tab === 'sheets' ? 'active' : ''}`} onClick={() => setTab('sheets')}>Google Sheets</button>
        </div>

        {tab === 'file' && (
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          >
            <input ref={inputRef} type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <div className="upload-icon">📂</div>
            <p className="upload-label">{loading ? 'Processing…' : 'Click or drag to upload'}</p>
            <p className="upload-hint">Supports .xls · .xlsx · .csv</p>
          </div>
        )}

        {tab === 'sheets' && (
          <div className="sheets-wrap">
            <p className="sheets-hint">Make your sheet public (Share → Anyone with link → Viewer), then paste the URL.</p>
            <input className="input" style={{ width: '100%' }} type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value={url} onChange={e => setUrl(e.target.value)} />
            <button className="btn btn-primary" disabled={loading || !url.trim()} onClick={() => onSheetUrl(url.trim())}>
              {loading ? 'Fetching…' : 'Load Sheet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
