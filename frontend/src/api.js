import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1'
})

export const uploadDocument = (data) => api.post('/documents', data)
export const getConcepts = (documentId) => api.get(`/documents/${documentId}/concepts`)
export const getDueReviews = () => api.get('/reviews/due')
export const getQuestion = (cardId) => api.get(`/reviews/${cardId}/question`)
export const submitReview = (cardId, quality) => api.post(`/reviews/${cardId}/submit`, { quality })