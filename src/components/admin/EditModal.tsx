"use client";

import { useState, useEffect } from 'react';

interface EditModalProps<T> {
    isOpen: boolean;
    title: string;
    data: T | null;
    fields: Array<{
        key: keyof T;
        label: string;
        type?: 'text' | 'number' | 'select' | 'textarea';
        options?: Array<{ value: string; label: string }>;
        required?: boolean;
    }>;
    onSave: (data: T) => void | Promise<void>;
    onCancel: () => void;
    saveText?: string;
    cancelText?: string;
}

export default function EditModal<T extends Record<string, any>>({
    isOpen,
    title,
    data,
    fields,
    onSave,
    onCancel,
    saveText = "Save",
    cancelText = "Cancel"
}: EditModalProps<T>) {
    const [formData, setFormData] = useState<T | null>(data);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(data);
    }, [data]);

    if (!isOpen || !formData) return null;

    const handleChange = (key: keyof T, value: any) => {
        setFormData(prev => prev ? { ...prev, [key]: value } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {fields.map((field) => (
                            <div key={String(field.key)}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        required={field.required}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        rows={3}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        required={field.required}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {field.options?.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                        required={field.required}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {saveText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
