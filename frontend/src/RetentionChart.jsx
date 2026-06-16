import { useEffect, useState } from 'react'
import { getReviewHistory } from './api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const qualityToRetention = (quality) => {
  const map = { 0: 0, 1: 10, 2: 25, 3: 50, 4: 80, 5: 100 }
  return map[quality] ?? 0
}

const COLORS = [
  '#6366f1', '#22c55e', '#f97316', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f59e0b'
]

export default function RetentionChart() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConcepts, setSelectedConcepts] = useState([])

  useEffect(() => {
    getReviewHistory()
      .then(res => {
        setHistory(res.data)
        // Auto-select first 4 concepts
        const unique = [...new Set(res.data.map(h => h.concept_title))]
        setSelectedConcepts(unique.slice(0, 4))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (history.length === 0) return null

  // Get all unique concepts
  const allConcepts = [...new Set(history.map(h => h.concept_title))]

  // Build chart data — one point per review session grouped by date
  const dateMap = {}
  history.forEach(entry => {
    const date = new Date(entry.reviewed_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
    if (!dateMap[date]) dateMap[date] = { date }
    dateMap[date][entry.concept_title] = qualityToRetention(entry.quality)
  })

  const chartData = Object.values(dateMap)

  const toggleConcept = (concept) => {
    setSelectedConcepts(prev =>
      prev.includes(concept)
        ? prev.filter(c => c !== concept)
        : [...prev, concept]
    )
  }

  return (
    <div style={{ marginTop: 32, maxWidth: 640 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
            Retention Over Time
          </h3>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            How well you've retained each concept across review sessions
          </p>
        </div>

        {/* Concept toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {allConcepts.map((concept, i) => {
            const isSelected = selectedConcepts.includes(concept)
            const color = COLORS[i % COLORS.length]
            return (
              <button key={concept} onClick={() => toggleConcept(concept)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  border: `1px solid ${isSelected ? color : '#e5e7eb'}`,
                  background: isSelected ? color + '15' : '#f9fafb',
                  color: isSelected ? color : '#9ca3af',
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                {concept}
              </button>
            )
          })}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            />
            {selectedConcepts.map((concept, i) => {
              const colorIndex = allConcepts.indexOf(concept)
              return (
                <Line
                  key={concept}
                  type="monotone"
                  dataKey={concept}
                  stroke={COLORS[colorIndex % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS[colorIndex % COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>

        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
          100% = Perfect recall · 50% = Partially remembered · 0% = Forgot
        </p>
      </div>
    </div>
  )
}