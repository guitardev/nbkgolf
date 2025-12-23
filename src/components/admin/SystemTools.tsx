"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ConfirmActionDialog, { ConfirmVariant } from './ConfirmActionDialog';

type ToolType = 'sync' | 'headers' | 'validate' | 'reset' | 'migrate' | 'courses';

export default function SystemTools() {
    const [loading, setLoading] = useState<ToolType | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        tool: ToolType | null;
        title: string;
        message: string;
        variant: ConfirmVariant;
        confirmText: string;
    }>({
        isOpen: false,
        tool: null,
        title: '',
        message: '',
        variant: 'info',
        confirmText: 'Confirm'
    });

    const t = useTranslations('adminTools');

    const initiateTool = (tool: ToolType) => {
        let config = {
            title: '',
            message: '',
            variant: 'info' as ConfirmVariant,
            confirmText: 'Start'
        };

        switch (tool) {
            case 'reset':
                config = {
                    title: t('reset.title'),
                    message: t('reset.confirm') + "\n\nWARNING: This action cannot be undone. All data will be permanently deleted.",
                    variant: 'danger',
                    confirmText: 'DELETE ALL DATA'
                };
                break;
            case 'sync':
                config = {
                    title: t('sync.title'),
                    message: "This will synchronize data from Google Sheets to the local cache. Existing cache will be overwritten.",
                    variant: 'info',
                    confirmText: 'Sync Data'
                };
                break;
            case 'headers':
                config = {
                    title: t('headers.title'),
                    message: "This will re-write headers in all Google Sheets. This might be useful if headers were accidentally deleted or modified.",
                    variant: 'warning',
                    confirmText: 'Fix Headers'
                };
                break;
            case 'validate':
                config = {
                    title: t('validate.title'),
                    message: "This will run a consistency check on all system data. No data will be modified.",
                    variant: 'info',
                    confirmText: 'Run Validation'
                };
                break;
            case 'migrate':
                config = {
                    title: t('migrate.title'),
                    message: "This will migrate old score data structure to the new format. Please ensure you have a backup before proceeding.",
                    variant: 'warning',
                    confirmText: 'Migrate Scores'
                };
                break;
            case 'courses':
                config = {
                    title: t('courses.title'),
                    message: "This will clean up course data and recalculate distances. It may affect saved scorecards.",
                    variant: 'warning',
                    confirmText: 'Fix Courses'
                };
                break;
        }

        setConfirmConfig({
            isOpen: true,
            tool,
            ...config
        });
    };

    const runTool = async () => {
        const tool = confirmConfig.tool;
        if (!tool) return;

        // Close dialog
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));

        setLoading(tool);
        setLogs([`${t('console.running')} (${tool})...`]);

        try {
            const res = await fetch(`/api/admin/system/${tool}`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setLogs(prev => [...prev, ...(data.logs || []), `✅ ${t('console.success')}`]);
            } else {
                setLogs(prev => [...prev, `❌ ${t('console.error')}: ${data.error}`]);
            }
        } catch (error) {
            setLogs(prev => [...prev, `❌ ${t('console.error')}: ${error}`]);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmActionDialog
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                confirmText={confirmConfig.confirmText}
                onConfirm={runTool}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Sync Data */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">🔄 {t('sync.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('sync.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('sync')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading === 'sync' ? t('console.running') : t('sync.button')}
                    </button>
                </div>

                {/* Fix Headers */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">🔧 {t('headers.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('headers.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('headers')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                        {loading === 'headers' ? t('console.running') : t('headers.button')}
                    </button>
                </div>

                {/* Validate System */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">🕵️ {t('validate.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('validate.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('validate')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading === 'validate' ? t('console.running') : t('validate.button')}
                    </button>
                </div>

                {/* Reset Data */}
                <div className="bg-white p-6 rounded-lg shadow border border-red-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-red-600 mb-2">🗑️ {t('reset.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('reset.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('reset')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading === 'reset' ? t('console.running') : t('reset.button')}
                    </button>
                </div>

                {/* Migrate Scores */}
                <div className="bg-white p-6 rounded-lg shadow border border-purple-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-purple-900 mb-2">📦 {t('migrate.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('migrate.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('migrate')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading === 'migrate' ? t('console.running') : t('migrate.button')}
                    </button>
                </div>

                {/* Fix Courses */}
                <div className="bg-white p-6 rounded-lg shadow border border-orange-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-orange-900 mb-2">⛳ {t('courses.title')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('courses.desc')}</p>
                    </div>
                    <button
                        onClick={() => initiateTool('courses')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                        {loading === 'courses' ? t('console.running') : t('courses.button')}
                    </button>
                </div>

                {/* Console Output */}
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto shadow-inner mt-6 col-span-1 md:col-span-2">
                    <div className="border-b border-gray-700 pb-2 mb-2 text-gray-400">{t('console.title')}</div>
                    {logs.length === 0 ? (
                        <div className="text-gray-600 italic">{t('console.ready')}</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1">
                                <span className="text-gray-500 mr-2">{new Date().toLocaleTimeString()}</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
