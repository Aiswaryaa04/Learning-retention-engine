import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
})

export const uploadDocument = (data) => api.post('/documents', data)
export const getConcepts = (documentId) => api.get(`/documents/${documentId}/concepts`)
export const getDueReviews = () => api.get('/reviews/due')
export const getDueReviewsByDocument = (documentId) => api.get(`/reviews/due/${documentId}`)
export const getQuestion = (cardId) => api.get(`/reviews/${cardId}/question`)
export const submitReview = (cardId, quality) => api.post(`/reviews/${cardId}/submit`, { quality })
export const evaluateAnswer = (cardId, data) => api.post(`/reviews/${cardId}/evaluate`, data)
export const getBrushup = (cardId) => api.get(`/reviews/${cardId}/brushup`)
export const getDocuments = () => api.get('/documents')
export const deleteDocument = (documentId) => api.delete(`/documents/${documentId}`)
export const updateDocument = (documentId, data) => api.patch(`/documents/${documentId}`, data)
export const uploadPDF = (title, file) => {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)
  return api.post('/documents/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}