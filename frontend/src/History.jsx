import { useEffect, useState } from 'react'
import { getDocuments, deleteDocument, updateDocument } from './api'

export default function History({ onReviewDocument }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

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

  const handleEditStart = (doc) => {
    setEditingId(doc.id)
    setEditTitle(doc.title)
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

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  if (loading) return (
    <p style={{ color: '#666', textAlign: 'center', padding: 48 }}>Loading history...</p>
  )

  if (documents.length === 0) return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <p style={{ fontSize: 48 }}>📚</p>
      <h2 style={{ marginTop: 8 }}>No documents yet</h2>
      <p style={{ color: '#666', marginTop: 8 }}>Upload some study material to get started.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Study History</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {documents.map(doc => (
          <div key={doc.id} style={{
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 8,
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              {editingId === doc.id ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEditSave(doc.id)}
                  autoFocus
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #000', borderRadius: 6, fontSize: 14, marginRight: 8 }}
                />
              ) : (
                <p style={{ fontWeight: 600, fontSize: 15 }}>{doc.title}</p>
              )}
            </div>

            {/* Meta */}
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              {doc.concept_count} concepts · {doc.source_type} · {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {editingId === doc.id ? (
                <>
                  <button onClick={() => handleEditSave(doc.id)}
                    style={{ padding: '6px 14px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    Save
                  </button>
                  <button onClick={handleEditCancel}
                    style={{ padding: '6px 14px', background: '#eee', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onReviewDocument(doc.id)}
                    style={{ padding: '6px 14px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    Review
                  </button>
                  <button onClick={() => handleEditStart(doc)}
                    style={{ padding: '6px 14px', background: '#eee', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    style={{ padding: '6px 14px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}