'use client'

import { useState, useCallback } from 'react'
import Toast from '@/components/Toast'

interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastData = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const ToastContainer = useCallback(() => (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(${index * 80}px)` }}
          className="transition-transform duration-300"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
          />
        </div>
      ))}
    </div>
  ), [toasts, hideToast])

  return {
    showToast,
    ToastContainer
  }
}
