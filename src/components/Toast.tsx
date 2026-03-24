'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none pt-[env(safe-area-inset-top)]">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`mt-3 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-xl text-sm font-medium pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-gray-900/90 text-white'
                  : toast.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-white/90 text-gray-900 border border-gray-200'
              }`}
            >
              <span className="mr-1.5">
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
              </span>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
