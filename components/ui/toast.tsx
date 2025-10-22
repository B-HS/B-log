import { X } from 'lucide-react'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { cn } from '../lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = crypto.randomUUID()
        setToasts((prev) => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, 5000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm'>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-center justify-between gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5',
                            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : '',
                            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : '',
                            toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900' : '',
                        )}
                        role='alert'
                        aria-live='polite'>
                        <p className='text-sm font-medium'>{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className='flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity'
                            aria-label='알림 닫기'>
                            <X className='h-4 w-4' />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
