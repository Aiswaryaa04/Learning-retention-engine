import { useEffect, useState } from 'react'
import { getDocuments, deleteDocument, updateDocument } from './api'

export default function History({ onReviewDocument }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchDocuments() }, [])

  const fetchDocuments = () => {
    setLoading(true)
    getDocuments()
      .then(res => setDocuments(res.data))
      .finally(() => setLoading(false))
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document and all its concepts?')) return
    setDeletingId(docId)
    try {
      await deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
    setDeletingId(null)
  }

  const handleEditSave = async (docId) => {
    if (!editTitle.trim()) return
    try {
      await updateDocument(docId, { title: editTitle })
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, title: editTitle } : d))
      setEditingId(null)
    } catch (err) {
      alert('Update failed: ' + err.message)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ color: '#6b7280' }}>Loading your library...</p>
    </div>
  )

  if (documents.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your library is empty</h2>
      <p style={{ color: '#6b7280', fontSize: 15 }}>Upload some study material from the Dashboard to get started.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {documents.map(doc => (
        <div key={doc.id} style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ flex: 1 }}>
            {editingId === doc.id ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditSave(doc.id)}
                autoFocus
                style={{ padding: '6px 10px', border: '1px solid #111827', borderRadius: 6, fontSize: 14, width: '100%', fontFamily: 'Inter, sans-serif', outline: 'none' }}
              />
            ) : (
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{doc.title}</p>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: editingId === doc.id ? 8 : 0 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {doc.concept_count} concept{doc.concept_count !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>•</span>
              <span style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{doc.source_type}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>•</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {editingId === doc.id ? (
              <>
                <button onClick={() => handleEditSave(doc.id)}
                  style={{ padding: '7px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)}
                  style={{ padding: '7px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onReviewDocument(doc.id)}
                  style={{ padding: '7px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  Review
                </button>
                <button onClick={() => { setEditingId(doc.id); setEditTitle(doc.title) }}
                  style={{ padding: '7px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                  style={{ padding: '7px 14px', background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                  {deletingId === doc.id ? '...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}