import { useState } from 'react'
import { uploadDocument, uploadPDF, uploadYouTube, getDueReviews, getDueReviewsByDocument, getQuestion, submitReview, evaluateAnswer, getBrushup, getConcepts } from './api'
import History from './History'
import Stats from './Stats'
import './App.css'
import RetentionChart from './RetentionChart'

const Sidebar = ({ view, setView, startReview }) => (
  <div style={{
    width: 240,
    minHeight: '100vh',
    background: '#fff',
    borderRight: '1px solid #e5e7eb',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    position: 'fixed',
    top: 0,
    left: 0,
  }}>
    <div style={{ padding: '8px 12px', marginBottom: 24 }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Retention</p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>AI-powered learning</p>
    </div>

    {[
      { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
      { id: 'history', icon: '📚', label: 'My Library' },
      { id: 'review', icon: '⚡', label: 'Review All' },
    ].map(item => (
      <button key={item.id}
        onClick={() => item.id === 'review' ? startReview() : setView(item.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: view === item.id ? '#f3f4f6' : 'transparent',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          textAlign: 'left', fontSize: 14,
          fontWeight: view === item.id ? 600 : 400,
          color: view === item.id ? '#111827' : '#6b7280',
          width: '100%', transition: 'all 0.15s',
          fontFamily: 'Inter, sans-serif'
        }}>
        <span style={{ fontSize: 16 }}>{item.icon}</span>
        {item.label}
      </button>
    ))}

    <div style={{ marginTop: 'auto', padding: '12px', background: '#f9fafb', borderRadius: 8 }}>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Powered by</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>Claude AI + pgvector</p>
    </div>
  </div>
)

export default function App() {
  const [view, setView] = useState('dashboard')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadedDocId, setUploadedDocId] = useState(null)
  const [dueCards, setDueCards] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [uploadMode, setUploadMode] = useState('text')
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploadingYoutube, setUploadingYoutube] = useState(false)
  const [reviewingDocumentId, setReviewingDocumentId] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [brushup, setBrushup] = useState(null)
  const [loadingBrushup, setLoadingBrushup] = useState(false)
  const [showBrushup, setShowBrushup] = useState(false)
  const [totalCards, setTotalCards] = useState(0)
  const [concepts, setConcepts] = useState([])
  const [studyMode, setStudyMode] = useState(null)
  const [studyIndex, setStudyIndex] = useState(0)
  const [studyDocId, setStudyDocId] = useState(null)

  const loadConceptsForDoc = async (docId) => {
    try {
      const res = await getConcepts(docId)
      setConcepts(res.data)
      setStudyDocId(docId)
    } catch (err) {
      console.error('Failed to load concepts', err)
    }
  }

  const handleUpload = async () => {
    if (!title || !content) return
    setUploading(true)
    try {
      const res = await uploadDocument({ title, content, source_type: 'text' })
      setUploadResult(res.data)
      setUploadedDocId(res.data.id)
      setTitle('')
      setContent('')
      await loadConceptsForDoc(res.data.id)
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
      setUploadedDocId(res.data.id)
      setTitle('')
      setPdfFile(null)
      await loadConceptsForDoc(res.data.id)
    } catch (err) {
      alert('PDF upload failed: ' + err.message)
    }
    setUploadingPdf(false)
  }

  const handleYoutubeUpload = async () => {
    if (!title || !youtubeUrl) return
    setUploadingYoutube(true)
    try {
      const res = await uploadYouTube({ title, url: youtubeUrl })
      setUploadResult(res.data)
      setUploadedDocId(res.data.id)
      setTitle('')
      setYoutubeUrl('')
      await loadConceptsForDoc(res.data.id)
    } catch (err) {
      alert('YouTube upload failed: ' + err.message)
    }
    setUploadingYoutube(false)
  }

  const startReview = async () => {
    setReviewingDocumentId(null)
    setView('review')
    setReviewDone(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
    setShowHint(false)
    setStudyMode(null)
    const res = await getDueReviews()
    setDueCards(res.data)
    setTotalCards(res.data.length)
    if (res.data.length > 0) loadQuestion(res.data[0].card_id)
  }

  const startDocumentReview = async (documentId) => {
    setReviewingDocumentId(documentId)
    setView('review')
    setReviewDone(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
    setShowHint(false)
    setStudyMode(null)
    const res = await getDueReviewsByDocument(documentId)
    setDueCards(res.data)
    setTotalCards(res.data.length)
    if (res.data.length > 0) loadQuestion(res.data[0].card_id)
  }

  const startStudyFirst = async (documentId) => {
    setStudyDocId(documentId)
    setView('review')
    setStudyMode('stepbystep')
    setStudyIndex(0)
    try {
      const res = await getConcepts(documentId)
      setConcepts(res.data)
    } catch (err) {
      alert('Failed to load concepts')
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

  const feedbackStyles = {
    full: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', label: '✓ Great answer!' },
    partial: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', label: '◑ Partially correct' },
    incorrect: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', label: '✗ Not quite right' }
  }

  const progress = totalCards > 0 ? ((totalCards - dueCards.length) / totalCards) * 100 : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar view={view} setView={setView} startReview={startReview} />

      <div style={{ marginLeft: 240, flex: 1, padding: '40px 48px', maxWidth: 900 }}>

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
              <p style={{ color: '#6b7280', fontSize: 15 }}>Add study material and let AI extract what matters.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32, maxWidth: 640 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add Study Material</h2>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f3f4f6', borderRadius: 8, padding: 4, width: 'fit-content' }}>
                {[
                  { id: 'text', label: 'Paste Text' },
                  { id: 'pdf', label: 'Upload PDF' },
                  { id: 'youtube', label: '▶ YouTube' },
                ].map(mode => (
                  <button key={mode.id} onClick={() => {
                    setUploadMode(mode.id)
                    setUploadResult(null)
                    setConcepts([])
                    setTitle('')
                    setContent('')
                    setPdfFile(null)
                    setYoutubeUrl('')
               }}
                    style={{
                      padding: '6px 20px',
                      background: uploadMode === mode.id ? '#fff' : 'transparent',
                      border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: 13, fontWeight: uploadMode === mode.id ? 600 : 400,
                      color: uploadMode === mode.id ? '#111827' : '#6b7280',
                      boxShadow: uploadMode === mode.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                    {mode.label}
                  </button>
                ))}
              </div>

              <input
                placeholder="Give this material a title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: 12,
                  border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                  boxSizing: 'border-box', outline: 'none', fontFamily: 'Inter, sans-serif'
                }}
              />

              {uploadMode === 'text' && (
                <>
                  <textarea
                    placeholder="Paste your notes, article, book chapter, or any text..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%', padding: '10px 14px', marginBottom: 16,
                      border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                      boxSizing: 'border-box', resize: 'vertical',
                      fontFamily: 'Inter, sans-serif', outline: 'none', lineHeight: 1.6
                    }}
                  />
                  <button onClick={handleUpload} disabled={uploading || !title || !content}
                    style={{
                      padding: '10px 24px', background: '#111827', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                      fontWeight: 500, opacity: (!title || !content) ? 0.5 : 1,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                    {uploading ? '⏳ Extracting concepts...' : '✦ Extract Concepts with AI'}
                  </button>
                </>
              )}

              {uploadMode === 'pdf' && (
                <>
                  <div onClick={() => document.getElementById('pdf-input').click()}
                    style={{
                      border: `2px dashed ${pdfFile ? '#86efac' : '#e5e7eb'}`,
                      borderRadius: 10, padding: '36px 24px', textAlign: 'center',
                      cursor: 'pointer', marginBottom: 16,
                      background: pdfFile ? '#f0fdf4' : '#fafafa'
                    }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>{pdfFile ? '✅' : '📄'}</p>
                    <p style={{ fontSize: 14, color: pdfFile ? '#16a34a' : '#6b7280', fontWeight: pdfFile ? 500 : 400 }}>
                      {pdfFile ? pdfFile.name : 'Click to select a PDF file'}
                    </p>
                    <input id="pdf-input" type="file" accept=".pdf" style={{ display: 'none' }}
                      onChange={e => setPdfFile(e.target.files[0])} />
                  </div>
                  <button onClick={handlePdfUpload} disabled={uploadingPdf || !pdfFile || !title}
                    style={{
                      padding: '10px 24px', background: '#111827', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                      fontWeight: 500, opacity: (!pdfFile || !title) ? 0.5 : 1,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                    {uploadingPdf ? '⏳ Processing PDF...' : '✦ Upload PDF & Extract Concepts'}
                  </button>
                </>
              )}

              {uploadMode === 'youtube' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      border: '1px solid #e5e7eb', borderRadius: 10,
                      padding: '20px 24px', background: '#fafafa', marginBottom: 12
                    }}>
                      <p style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}>▶</p>
                      <input
                        placeholder="Paste YouTube URL here... (e.g. https://youtube.com/watch?v=...)"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px',
                          border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                          boxSizing: 'border-box', outline: 'none',
                          fontFamily: 'Inter, sans-serif', background: '#fff'
                        }}
                      />
                      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                        Works with any YouTube video that has captions or auto-generated subtitles.
                      </p>
                    </div>
                  </div>
                  <button onClick={handleYoutubeUpload} disabled={uploadingYoutube || !youtubeUrl || !title}
                    style={{
                      padding: '10px 24px', background: '#111827', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                      fontWeight: 500, opacity: (!youtubeUrl || !title) ? 0.5 : 1,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                    {uploadingYoutube ? '⏳ Fetching transcript...' : '✦ Extract Concepts from Video'}
                  </button>
                </>
              )}

              {/* Success + concept viewer */}
              {uploadResult && concepts.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                    <p style={{ fontWeight: 600, color: '#16a34a', fontSize: 14 }}>
                      ✓ {concepts.length} concepts extracted from "{uploadResult.title}"
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                      What was extracted:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {concepts.map((concept, i) => (
                        <div key={concept.id} style={{
                          padding: '12px 16px', background: '#f9fafb',
                          borderRadius: 8, border: '1px solid #e5e7eb'
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                            {i + 1}. {concept.title}
                          </p>
                          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                            {concept.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startStudyFirst(uploadedDocId)}
                      style={{
                        flex: 1, padding: '10px 0', background: '#fff',
                        color: '#111827', border: '1px solid #e5e7eb',
                        borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                      📖 Study First
                    </button>
                    <button onClick={() => startDocumentReview(uploadedDocId)}
                      style={{
                        flex: 1, padding: '10px 0', background: '#111827',
                        color: '#fff', border: 'none',
                        borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                      ⚡ Start Review
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!uploadResult && (
              <div style={{ display: 'flex', gap: 16, marginTop: 32, maxWidth: 640 }}>
                {[
                  { icon: '1', text: 'Upload text, PDF, or YouTube video' },
                  { icon: '2', text: 'AI extracts key concepts' },
                  { icon: '3', text: 'Review at the right time' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <div style={{ width: 28, height: 28, background: '#111827', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{item.icon}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            )}

            <Stats onStartReview={startReview} />
            <RetentionChart />

          </div>
        )}

        {/* History */}
        {view === 'history' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>My Library</h1>
              <p style={{ color: '#6b7280', fontSize: 15 }}>All your study materials in one place.</p>
            </div>
            <History
              onReviewDocument={(docId) => startDocumentReview(docId)}
              onStudyDocument={(docId) => startStudyFirst(docId)}
            />
          </div>
        )}

        {/* Review / Study */}
        {view === 'review' && (
          <div style={{ maxWidth: 640 }}>

            {/* Step by step study mode */}
            {studyMode === 'stepbystep' && concepts.length > 0 && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Study Mode</h1>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>Concept {studyIndex + 1} of {concepts.length}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>{Math.round(((studyIndex + 1) / concepts.length) * 100)}%</p>
                  </div>
                  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${((studyIndex + 1) / concepts.length) * 100}%`, background: '#111827', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32, marginBottom: 16 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f3f4f6', borderRadius: 99, fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Concept {studyIndex + 1}
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#111827' }}>
                    {concepts[studyIndex].title}
                  </h2>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>
                    {concepts[studyIndex].explanation}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {studyIndex > 0 && (
                    <button onClick={() => setStudyIndex(studyIndex - 1)}
                      style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                      ← Previous
                    </button>
                  )}
                  {studyIndex < concepts.length - 1 ? (
                    <button onClick={() => setStudyIndex(studyIndex + 1)}
                      style={{ flex: 1, padding: '10px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={() => { setStudyMode(null); startDocumentReview(studyDocId) }}
                      style={{ flex: 1, padding: '10px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                      ⚡ Start Review Quiz
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Normal review mode */}
            {studyMode === null && (
              <div>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Review Session</h1>
                  {totalCards > 0 && !reviewDone && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>{totalCards - dueCards.length} of {totalCards} completed</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>{Math.round(progress)}%</p>
                      </div>
                      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#111827', borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}
                </div>

                {reviewDone && (
                  <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 56, marginBottom: 16 }}>🎉</p>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Session Complete!</h2>
                    <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 28 }}>You reviewed {totalCards} concept{totalCards !== 1 ? 's' : ''}. Come back tomorrow for your next session.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <button onClick={() => setView('dashboard')}
                        style={{ padding: '10px 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                        Back to Dashboard
                      </button>
                      <button onClick={() => setView('history')}
                        style={{ padding: '10px 24px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                        View Library
                      </button>
                    </div>
                  </div>
                )}

                {!reviewDone && loadingQuestion && (
                  <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>⚡</p>
                    <p style={{ color: '#6b7280', fontSize: 15 }}>Generating your question...</p>
                  </div>
                )}

                {!reviewDone && !loadingQuestion && currentQuestion && (
                  <div>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, marginBottom: 16 }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f3f4f6', borderRadius: 99, fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {currentQuestion.concept_title}
                      </span>
                      <p style={{ fontSize: 16, lineHeight: 1.75, color: '#111827' }}>{currentQuestion.question}</p>
                    </div>

                    {!feedback && !showAnswer && (
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Your Answer</p>
                        <textarea
                          placeholder="Type your answer here before seeing the correct one..."
                          value={userAnswer}
                          onChange={e => setUserAnswer(e.target.value)}
                          rows={4}
                          style={{
                            width: '100%', padding: '10px 14px', marginBottom: 14,
                            border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                            boxSizing: 'border-box', resize: 'vertical',
                            fontFamily: 'Inter, sans-serif', outline: 'none', lineHeight: 1.6
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={handleEvaluate} disabled={evaluating || !userAnswer.trim()}
                            style={{
                              padding: '9px 20px', background: '#111827', color: '#fff',
                              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                              fontWeight: 500, opacity: !userAnswer.trim() ? 0.4 : 1,
                              fontFamily: 'Inter, sans-serif'
                            }}>
                            {evaluating ? 'Evaluating...' : 'Submit Answer'}
                          </button>
                          <button onClick={() => setShowAnswer(true)}
                            style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                            Skip — Show Answer
                          </button>
                          {!showHint && (
                            <button onClick={() => setShowHint(true)}
                              style={{ padding: '9px 20px', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                              💡 Hint
                            </button>
                          )}
                        </div>
                        {showHint && (
                          <div style={{ marginTop: 14, padding: '12px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>HINT</p>
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#78350f' }}>{currentQuestion.hint}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {feedback && (
                      <div style={{
                        padding: '16px 20px',
                        background: feedbackStyles[feedback.score]?.bg || '#f9fafb',
                        borderRadius: 10,
                        border: `1px solid ${feedbackStyles[feedback.score]?.border || '#e5e7eb'}`,
                        marginBottom: 16
                      }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: feedbackStyles[feedback.score]?.color || '#374151', marginBottom: 8 }}>
                          {feedbackStyles[feedback.score]?.label || 'Feedback'}
                        </p>
                        <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 10 }}>{feedback.feedback}</p>
                        <p style={{ fontSize: 13, color: '#555', fontStyle: 'italic' }}>💡 {feedback.tip}</p>
                      </div>
                    )}

                    {showAnswer && (
                      <div>
                        {!feedback && (
                          <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 12 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>HINT</p>
                            <p style={{ fontSize: 13, lineHeight: 1.6 }}>{currentQuestion.hint}</p>
                          </div>
                        )}
                        <div style={{ padding: '16px 20px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 8 }}>CORRECT ANSWER</p>
                          <p style={{ fontSize: 14, lineHeight: 1.7 }}>{currentQuestion.answer}</p>
                        </div>

                        <button onClick={handleBrushup}
                          style={{ padding: '8px 16px', background: '#fff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                          🔍 Deep dive into this concept
                        </button>

                        {showBrushup && (
                          <div style={{ padding: '16px 20px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deep Dive</p>
                              <button onClick={() => setShowBrushup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>×</button>
                            </div>
                            {loadingBrushup
                              ? <p style={{ fontSize: 14, color: '#6b7280' }}>Loading explanation...</p>
                              : <p style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}>{brushup}</p>
                            }
                          </div>
                        )}

                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>How well did you know this?</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[
                              { q: 0, label: 'Forgot', color: '#ef4444' },
                              { q: 2, label: 'Hard', color: '#f97316' },
                              { q: 4, label: 'Good', color: '#22c55e' },
                              { q: 5, label: 'Easy', color: '#3b82f6' },
                            ].map(({ q, label, color }) => (
                              <button key={q} onClick={() => handleGrade(q)}
                                style={{
                                  flex: 1, padding: '10px 0', background: color,
                                  color: '#fff', border: 'none', borderRadius: 8,
                                  cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                  fontFamily: 'Inter, sans-serif'
                                }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!reviewDone && !loadingQuestion && dueCards.length === 0 && !currentQuestion && (
                  <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're all caught up!</h2>
                    <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
                      {reviewingDocumentId ? 'No cards due for this topic right now.' : 'No reviews due. Add more material or check back later.'}
                    </p>
                    <button onClick={() => setView('dashboard')}
                      style={{ padding: '10px 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                      Add More Material
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}