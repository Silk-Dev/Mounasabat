"use client"

import * as React from "react"
import { X } from "lucide-react"

type ToastProps = {
  show: boolean
  onDismiss: () => void
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
}

export function Toast({
  show,
  onDismiss,
  title,
  description,
  duration = 5000,
  variant = "default",
}: ToastProps) {
  React.useEffect(() => {
    if (show && duration) {
      const timer = setTimeout(() => {
        onDismiss()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onDismiss])

  if (!show) return null

  const variants = {
    default: "bg-white border border-gray-200 text-gray-900",
    destructive: "bg-red-500 text-white",
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
      <div
        className={`relative rounded-lg p-4 shadow-lg ${variants[variant]}`}
        role="alert"
      >
        <div className="flex items-start">
          <div className="flex-1">
            {title && (
              <h3 className="text-sm font-medium mb-1">
                {title}
              </h3>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-4 -mx-1.5 -my-1.5 rounded-lg p-1.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

type ToastContextType = {
  showToast: (props: Omit<ToastProps, "show" | "onDismiss">) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<Omit<ToastProps, "onDismiss"> | null>(
    null
  )

  const showToast = React.useCallback(
    (props: Omit<ToastProps, "show" | "onDismiss">) => {
      setToast({ ...props, show: true })
    },
    []
  )

  const dismissToast = React.useCallback(() => {
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          {...toast}
          onDismiss={dismissToast}
        />
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
