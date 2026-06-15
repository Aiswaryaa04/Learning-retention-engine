import { useState } from 'react'
import { uploadDocument, uploadPDF, getDueReviews, getDueReviewsByDocument, getQuestion, submitReview, evaluateAnswer, getBrushup } from './api'
import History from './History'
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
  const [showHint, setShowHint] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [uploadMode, setUploadMode] = useState('text')
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [reviewingDocumentId, setReviewingDocumentId] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [brushup, setBrushup] = useState(null)
  const [loadingBrushup, setLoadingBrushup] = useState(false)
  const [showBrushup, setShowBrushup] = useState(false)

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

  const handlePdfUpload = async () => {
    if (!title || !pdfFile) return
    setUploadingPdf(true)
    try {
      const res = await uploadPDF(title, pdfFile)
      setUploadResult(res.data)
      setTitle('')
      setPdfFile(null)
    } catch (err) {
      alert('PDF upload failed: ' + err.message)
    }
    setUploadingPdf(false)
  }

  const startReview = async () => {
    setReviewingDocumentId(null)
    setView('review')
    setReviewDone(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
    setShowHint(false)
    const res = await getDueReviews()
    setDueCards(res.data)
    if (res.data.length > 0) {
      loadQuestion(res.data[0].card_id)
    }
  }

  const startDocumentReview = async (documentId) => {
    setReviewingDocumentId(documentId)
    setView('review')
    setReviewDone(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
    setShowHint(false)
    const res = await getDueReviewsByDocument(documentId)
    setDueCards(res.data)
    if (res.data.length > 0) {
      loadQuestion(res.data[0].card_id)
    }
  }

  const loadQuestion = async (cardId) => {
    setLoadingQuestion(true)
    setShowAnswer(false)
    setShowHint(false)
    setUserAnswer('')
    setFeedback(null)
    setBrushup(null)
    setShowBrushup(false)
    try {
      const res = await getQuestion(cardId)
      setCurrentQuestion(res.data)
    } catch (err) {
      alert('Failed to load question')
    }
    setLoadingQuestion(false)
  }

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return
    setEvaluating(true)
    try {
      const res = await evaluateAnswer(currentQuestion.card_id, {
        question: currentQuestion.question,
        correct_answer: currentQuestion.answer,
        user_answer: userAnswer
      })
      setFeedback(res.data)
      setShowAnswer(true)
    } catch (err) {
      alert('Evaluation failed: ' + err.message)
    }
    setEvaluating(false)
  }

  const handleBrushup = async () => {
    setShowBrushup(true)
    if (brushup) return
    setLoadingBrushup(true)
    try {
      const res = await getBrushup(currentQuestion.card_id)
      setBrushup(res.data.brushup)
    } catch (err) {
      alert('Failed to load brushup')
    }
    setLoadingBrushup(false)
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

  const feedbackColor = {
    full: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: '✓ Great answer!' },
    partial: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '~ Partially correct' },
    incorrect: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: '✗ Not quite' }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        Learning Retention Engine
      </h1>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
        <button onClick={() => setView('dashboard')}
          style={{ padding: '8px 16px', background: view === 'dashboard' ? '#000' : '#eee', color: view === 'dashboard' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Dashboard
        </button>
        <button onClick={() => setView('history')}
          style={{ padding: '8px 16px', background: view === 'history' ? '#000' : '#eee', color: view === 'history' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          History
        </button>
        <button onClick={startReview}
          style={{ padding: '8px 16px', background: view === 'review' ? '#000' : '#eee', color: view === 'review' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Review All
        </button>
      </div>

      {/* Dashboard */}
      {view === 'dashboard' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Add Study Material</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setUploadMode('text')}
              style={{ padding: '6px 16px', background: uploadMode === 'text' ? '#000' : '#eee', color: uploadMode === 'text' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Paste Text
            </button>
            <button onClick={() => setUploadMode('pdf')}
              style={{ padding: '6px 16px', background: uploadMode === 'pdf' ? '#000' : '#eee', color: uploadMode === 'pdf' ? '#fff' : '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Upload PDF
            </button>
          </div>

          <input
            placeholder="Title (e.g. Python Decorators)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />

          {uploadMode === 'text' ? (
            <>
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
            </>
          ) : (
            <>
              <div
                onClick={() => document.getElementById('pdf-input').click()}
                style={{ border: '2px dashed #ddd', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: pdfFile ? '#f0fdf4' : '#fafafa' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
                <p style={{ fontSize: 14, color: '#666' }}>
                  {pdfFile ? pdfFile.name : 'Click to select a PDF file'}
                </p>
                <input id="pdf-input" type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => setPdfFile(e.target.files[0])} />
              </div>
              <button onClick={handlePdfUpload} disabled={uploadingPdf || !pdfFile}
                style={{ padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, opacity: !pdfFile ? 0.5 : 1 }}>
                {uploadingPdf ? 'Processing PDF...' : 'Upload PDF & Extract Concepts'}
              </button>
            </>
          )}

          {uploadResult && (
            <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ fontWeight: 600, color: '#16a34a' }}>✓ Concepts extracted successfully!</p>
              <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Click Review to start studying.</p>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {view === 'history' && (
        <History onReviewDocument={(docId) => startDocumentReview(docId)} />
      )}

      {/* Review */}
      {view === 'review' && (
        <div>
          {reviewDone && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 48 }}>🎉</p>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>All done for today!</h2>
              <p style={{ color: '#666', marginTop: 8 }}>Come back tomorrow for your next review session.</p>
              <button onClick={() => setView('dashboard')}
                style={{ marginTop: 16, padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Back to Dashboard
              </button>
            </div>
          )}

          {!reviewDone && loadingQuestion && (
            <p style={{ color: '#666', textAlign: 'center', padding: 48 }}>Generating question...</p>
          )}

          {!reviewDone && !loadingQuestion && currentQuestion && (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} remaining
              </p>

              {/* Question */}
              <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {currentQuestion.concept_title}
                </p>
                <p style={{ fontSize: 16, lineHeight: 1.7 }}>{currentQuestion.question}</p>
              </div>

              {/* Answer input — shown before evaluation */}
              {!feedback && !showAnswer && (
                <div>
                  <textarea
                    placeholder="Type your answer here before seeing the correct one..."
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={handleEvaluate} disabled={evaluating || !userAnswer.trim()}
                      style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: !userAnswer.trim() ? 0.5 : 1 }}>
                      {evaluating ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                    <button onClick={() => setShowAnswer(true)}
                      style={{ padding: '10px 20px', background: '#eee', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Skip — Show Answer
                    </button>
                    {!showHint && (
                      <button onClick={() => setShowHint(true)}
                        style={{ padding: '10px 20px', background: '#eee', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        Hint
                      </button>
                    )}
                  </div>

                  {/* Hint */}
                  {showHint && (
                    <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginTop: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>HINT</p>
                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{currentQuestion.hint}</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Feedback on user's answer */}
              {feedback && (
                <div style={{ padding: 16, background: feedbackColor[feedback.score].bg, borderRadius: 8, border: `1px solid ${feedbackColor[feedback.score].border}`, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: feedbackColor[feedback.score].text, marginBottom: 8 }}>
                    {feedbackColor[feedback.score].label}
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{feedback.feedback}</p>
                  <p style={{ fontSize: 13, color: '#555', fontStyle: 'italic' }}>💡 {feedback.tip}</p>
                </div>
              )}

              {/* Correct answer */}
              {showAnswer && (
                <div>
                  {!feedback && (
                    <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>HINT</p>
                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{currentQuestion.hint}</p>
                    </div>
                  )}
                  <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 8 }}>CORRECT ANSWER</p>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>{currentQuestion.answer}</p>
                  </div>

                  {/* Brush up button */}
                  <button onClick={handleBrushup}
                    style={{ padding: '8px 16px', background: '#fff', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                    🔍 Deep dive into this concept
                  </button>

                  {/* Brushup popover */}
                  {showBrushup && (
                    <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase' }}>Deep Dive</p>
                        <button onClick={() => setShowBrushup(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>✕</button>
                      </div>
                      {loadingBrushup
                        ? <p style={{ fontSize: 14, color: '#666' }}>Loading explanation...</p>
                        : <p style={{ fontSize: 14, lineHeight: 1.7 }}>{brushup}</p>
                      }
                    </div>
                  )}

                  {/* Grading */}
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
              <h2 style={{ marginTop: 8 }}>No reviews due!</h2>
              <p style={{ color: '#666', marginTop: 8 }}>
                {reviewingDocumentId ? 'No cards due for this document.' : 'Upload some study material to get started.'}
              </p>
              <button onClick={() => setView('history')}
                style={{ marginTop: 16, padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Back to History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}