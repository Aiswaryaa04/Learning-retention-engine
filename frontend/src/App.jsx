import { useState } from 'react'
import { uploadDocument, getDueReviews, getQuestion, submitReview } from './api'
import './App.css'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [dueCards, setDueCards] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const handleUpload = async () => {
    if (!title || !content) return
    setUploading(true)
    try {
      const res = await uploadDocument({ title, content, source_type: 'text' })
      setUploadResult(res.data)
      setTitle('')
      setContent('')
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  const startReview = async () => {
    setView('review')
    setReviewDone(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
    const res = await getDueReviews()
    setDueCards(res.data)
    if (res.data.length > 0) {
      loadQuestion(res.data[0].card_id)
    }
  }

  const loadQuestion = async (cardId) => {
    setLoadingQuestion(true)
    setShowAnswer(false)
    try {
      const res = await getQuestion(cardId)
      setCurrentQuestion(res.data)
    } catch (err) {
      alert('Failed to load question')
    }
    setLoadingQuestion(false)
  }

  const handleGrade = async (quality) => {
    await submitReview(currentQuestion.card_id, quality)
    const remaining = dueCards.filter(c => c.card_id !== currentQuestion.card_id)
    setDueCards(remaining)
    if (remaining.length > 0) {
      loadQuestion(remaining[0].card_id)
    } else {
      setReviewDone(true)
      setCurrentQuestion(null)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Learning Retention Engine
      </h1>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button onClick={() => setView('dashboard')}
          style={{ padding: '8px 16px', background: view === 'dashboard' ? '#000' : '#eee', color: view === 'dashboard' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Dashboard
        </button>
        <button onClick={startReview}
          style={{ padding: '8px 16px', background: view === 'review' ? '#000' : '#eee', color: view === 'review' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Review
        </button>
      </div>

      {/* Dashboard */}
      {view === 'dashboard' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Add Study Material</h2>
          <input
            placeholder="Title (e.g. Python Decorators)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          <textarea
            placeholder="Paste your notes, article, or any text here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          <button onClick={handleUpload} disabled={uploading}
            style={{ padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            {uploading ? 'Extracting concepts...' : 'Upload & Extract Concepts'}
          </button>

          {uploadResult && (
            <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ fontWeight: 600, color: '#16a34a' }}>✓ Concepts extracted successfully!</p>
              <p style={{ fontSize: 13, color: '#666' }}>Document ID: {uploadResult.id}</p>
              <p style={{ fontSize: 13, color: '#666' }}>Click Review to start studying.</p>
            </div>
          )}
        </div>
      )}

      {/* Review */}
      {view === 'review' && (
        <div>
          {reviewDone && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 48 }}>🎉</p>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>All done for today!</h2>
              <p style={{ color: '#666' }}>Come back tomorrow for your next review session.</p>
              <button onClick={() => setView('dashboard')}
                style={{ marginTop: 16, padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Back to Dashboard
              </button>
            </div>
          )}

          {!reviewDone && loadingQuestion && (
            <p style={{ color: '#666' }}>Generating question...</p>
          )}

          {!reviewDone && !loadingQuestion && currentQuestion && (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} remaining
              </p>
              <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
                  {currentQuestion.concept_title}
                </p>
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>{currentQuestion.question}</p>
              </div>

              {!showAnswer && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAnswer(true)}
                    style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    Show Answer
                  </button>
                  <button onClick={() => setShowAnswer(true)}
                    style={{ padding: '10px 20px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    Show Hint
                  </button>
                </div>
              )}

              {showAnswer && (
                <div>
                  <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>HINT</p>
                    <p style={{ fontSize: 14 }}>{currentQuestion.hint}</p>
                  </div>
                  <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 8 }}>ANSWER</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{currentQuestion.answer}</p>
                  </div>

                  <p style={{ fontWeight: 600, marginBottom: 12 }}>How well did you know this?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { q: 0, label: 'Forgot', color: '#ef4444' },
                      { q: 2, label: 'Hard', color: '#f97316' },
                      { q: 4, label: 'Good', color: '#22c55e' },
                      { q: 5, label: 'Easy', color: '#3b82f6' },
                    ].map(({ q, label, color }) => (
                      <button key={q} onClick={() => handleGrade(q)}
                        style={{ flex: 1, padding: '10px 0', background: color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!reviewDone && !loadingQuestion && dueCards.length === 0 && !currentQuestion && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 48 }}>✅</p>
              <h2>No reviews due!</h2>
              <p style={{ color: '#666' }}>Upload some study material to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}