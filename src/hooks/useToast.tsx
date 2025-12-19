"use client";

import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

    const ToastContainer = useCallback(() => (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-lg shadow-lg text-white animate-slide-in ${
                        toast.type === 'success' ? 'bg-green-600' :
                        toast.type === 'error' ? 'bg-red-600' :
                        'bg-blue-600'
                    }`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    ), [toasts]);

return { success, error, info, ToastContainer };
}
