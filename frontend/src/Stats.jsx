import { useEffect, useState } from 'react'
import { getReviewStats } from './api'

const riskConfig = {
  at_risk: {
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: '🔴',
    label: 'About to forget'
  },
  overdue: {
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    icon: '🟠',
    label: 'Overdue'
  },
  due_today: {
    color: '#eab308',
    bg: '#fefce8',
    border: '#fef08a',
    icon: '🟡',
    label: 'Due today'
  },
  due_soon: {
    color: '#22c55e',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '🟢',
    label: 'Due soon'
  },
  safe: {
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    icon: '✅',
    label: 'Safe'
  }
}

export default function Stats({ onStartReview }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getReviewStats()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: '20px 0', color: '#6b7280', fontSize: 14 }}>
      Analyzing your retention...
    </div>
  )

  if (!stats || stats.total_concepts === 0) return null

  const atRiskCount = stats.at_risk.length + stats.overdue.length
  const dueTodayCount = stats.due_today.length

  return (
    <div style={{ marginTop: 32, maxWidth: 640 }}>

      {/* Warning banner */}
      {(atRiskCount > 0 || dueTodayCount > 0) && (
        <div style={{
          padding: '16px 20px',
          background: atRiskCount > 0 ? '#fef2f2' : '#fefce8',
          border: `1px solid ${atRiskCount > 0 ? '#fecaca' : '#fef08a'}`,
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: atRiskCount > 0 ? '#991b1b' : '#854d0e', marginBottom: 4 }}>
              {atRiskCount > 0
                ? `⚠️ ${atRiskCount} concept${atRiskCount !== 1 ? 's' : ''} at risk of being forgotten`
                : `📅 ${dueTodayCount} concept${dueTodayCount !== 1 ? 's' : ''} due for review today`
              }
            </p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {atRiskCount > 0
                ? "Review them now before they slip away"
                : "Stay on track with your spaced repetition schedule"
              }
            </p>
          </div>
          <button onClick={onStartReview}
            style={{
              padding: '8px 16px',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginLeft: 16
            }}>
            Review Now
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'At Risk', count: stats.at_risk.length, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Overdue', count: stats.overdue.length, color: '#f97316', bg: '#fff7ed' },
          { label: 'Due Today', count: stats.due_today.length, color: '#eab308', bg: '#fefce8' },
          { label: 'Safe', count: stats.safe.length, color: '#22c55e', bg: '#f0fdf4' },
        ].map(item => (
          <div key={item.label} style={{
            padding: '14px 16px',
            background: item.count > 0 ? item.bg : '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: item.count > 0 ? item.color : '#9ca3af' }}>
              {item.count}
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* At risk concepts list */}
      {stats.at_risk.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setExpanded(expanded === 'at_risk' ? null : 'at_risk')}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: expanded === 'at_risk' ? '10px 10px 0 0' : 10,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#991b1b'
            }}>
            <span>🔴 At Risk of Being Forgotten ({stats.at_risk.length})</span>
            <span>{expanded === 'at_risk' ? '▲' : '▼'}</span>
          </button>
          {expanded === 'at_risk' && (
            <div style={{ border: '1px solid #fecaca', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
              {stats.at_risk.map((item, i) => (
                <div key={item.card_id} style={{
                  padding: '12px 16px',
                  background: '#fff',
                  borderTop: i > 0 ? '1px solid #fee2e2' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{item.concept_title}</p>
                    <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                      {item.days_overdue} day{item.days_overdue !== 1 ? 's' : ''} overdue
                    </p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', color: '#ef4444', borderRadius: 99, fontWeight: 600 }}>
                    FORGOTTEN?
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overdue concepts */}
      {stats.overdue.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setExpanded(expanded === 'overdue' ? null : 'overdue')}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: expanded === 'overdue' ? '10px 10px 0 0' : 10,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#c2410c'
            }}>
            <span>🟠 Overdue ({stats.overdue.length})</span>
            <span>{expanded === 'overdue' ? '▲' : '▼'}</span>
          </button>
          {expanded === 'overdue' && (
            <div style={{ border: '1px solid #fed7aa', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
              {stats.overdue.map((item, i) => (
                <div key={item.card_id} style={{
                  padding: '12px 16px',
                  background: '#fff',
                  borderTop: i > 0 ? '1px solid #ffedd5' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{item.concept_title}</p>
                    <p style={{ fontSize: 12, color: '#f97316', marginTop: 2 }}>
                      {item.days_overdue} day{item.days_overdue !== 1 ? 's' : ''} overdue
                    </p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', background: '#fff7ed', color: '#f97316', borderRadius: 99, fontWeight: 600 }}>
                    OVERDUE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Due today */}
      {stats.due_today.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setExpanded(expanded === 'due_today' ? null : 'due_today')}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#fefce8', border: '1px solid #fef08a',
              borderRadius: expanded === 'due_today' ? '10px 10px 0 0' : 10,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#854d0e'
            }}>
            <span>🟡 Due Today ({stats.due_today.length})</span>
            <span>{expanded === 'due_today' ? '▲' : '▼'}</span>
          </button>
          {expanded === 'due_today' && (
            <div style={{ border: '1px solid #fef08a', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
              {stats.due_today.map((item, i) => (
                <div key={item.card_id} style={{
                  padding: '12px 16px',
                  background: '#fff',
                  borderTop: i > 0 ? '1px solid #fef9c3' : 'none',
                }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{item.concept_title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Review today to stay on schedule</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}