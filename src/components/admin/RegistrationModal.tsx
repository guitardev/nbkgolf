"use client";

import { useState, useEffect } from 'react';
import { Player, Tournament, TournamentPlayer } from '@/lib/googleSheets';
import { X, Search } from 'lucide-react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<TournamentPlayer> & { isGuest?: boolean }) => Promise<void>;
    tournaments: Tournament[];
    players: Player[];
    initialData?: TournamentPlayer | null;
    mode: 'create' | 'edit';
}

export default function RegistrationModal({
    isOpen,
    onClose,
    onSave,
    tournaments,
    players,
    initialData,
    mode
}: RegistrationModalProps) {
    const [formData, setFormData] = useState({
        tournamentId: '',
        playerId: '',
        team: '',
        status: 'pending',
        isGuest: false,
        guestName: '',
        guestEmail: '',
        guestPhone: '',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form when modal opens or data changes
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    tournamentId: initialData.tournamentId,
                    playerId: initialData.playerId || '',
                    team: initialData.team || '',
                    status: initialData.status,
                    isGuest: !initialData.playerId,
                    guestName: initialData.guestName || '',
                    guestEmail: initialData.guestEmail || '',
                    guestPhone: initialData.guestPhone || '',
                });
            } else {
                // Reset for create mode
                // Default to first active/upcoming tournament if available
                const defaultTournament = tournaments.find(t => t.status === 'active' || t.status === 'upcoming');
                setFormData({
                    tournamentId: defaultTournament?.id || tournaments[0]?.id || '',
                    playerId: '',
                    team: '',
                    status: 'pending',
                    isGuest: false,
                    guestName: '',
                    guestEmail: '',
                    guestPhone: '',
                });
                setSearchTerm('');
            }
        }
    }, [isOpen, initialData, mode, tournaments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Prepare data for API
            const submissionData: any = {
                tournamentId: formData.tournamentId,
                team: formData.team,
                status: formData.status as any,
            };

            if (formData.isGuest) {
                submissionData.guestName = formData.guestName;
                submissionData.guestEmail = formData.guestEmail;
                submissionData.guestPhone = formData.guestPhone;
                // Ensure playerId is undefined for guests
                submissionData.playerId = undefined;
                submissionData.isGuest = true;
            } else {
                submissionData.playerId = formData.playerId;
                submissionData.isGuest = false;
            }

            // Include ID if editing
            if (mode === 'edit' && initialData) {
                submissionData.id = initialData.id;
            }

            await onSave(submissionData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.team && p.team.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 50); // Limit results for performance

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                {/* Background Overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                {/* Modal Positioning */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Content */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900" id="modal-title">
                                {mode === 'create' ? 'Add Registration' : 'Edit Registration'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form id="regForm" onSubmit={handleSubmit} className="space-y-4">
                            {/* Tournament Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tournament</label>
                                <select
                                    required
                                    value={formData.tournamentId}
                                    onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3"
                                    disabled={mode === 'edit'} // Don't change tournament on edit usually
                                >
                                    <option value="">Select Tournament</option>
                                    {tournaments.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.date})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Player Type Selection (Create Mode Only) */}
                            {mode === 'create' && (
                                <div className="flex rounded-md bg-gray-100 p-1 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isGuest: false })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!formData.isGuest ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Existing Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isGuest: true })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.isGuest ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Guest
                                    </button>
                                </div>
                            )}

                            {/* Member Selection */}
                            {!formData.isGuest ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Find Player</label>
                                    {mode === 'create' ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3"
                                                    placeholder="Search by name..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                required
                                                value={formData.playerId}
                                                onChange={(e) => {
                                                    const pid = e.target.value;
                                                    const player = players.find(p => p.id === pid);
                                                    setFormData({
                                                        ...formData,
                                                        playerId: pid,
                                                        team: player?.team || formData.team // Auto-fill team
                                                    });
                                                }}
                                                size={5}
                                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 text-sm"
                                            >
                                                {filteredPlayers.length > 0 ? (
                                                    filteredPlayers.map(p => (
                                                        <option key={p.id} value={p.id} className="py-1 px-2 cursor-pointer hover:bg-emerald-50">
                                                            {p.name} {p.team ? `(${p.team})` : ''}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No players found</option>
                                                )}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                            {players.find(p => p.id === formData.playerId)?.name || 'Unknown Player'}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Guest Details */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Guest Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.guestName}
                                            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4"
                                            placeholder="Enter guest name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.guestPhone}
                                                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4"
                                                placeholder="0812345678"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.guestEmail}
                                                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4"
                                                placeholder="guest@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Common Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Team</label>
                                    <input
                                        type="text"
                                        value={formData.team}
                                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="paid">Paid</option>
                                        <option value="withdrawn">Withdrawn</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse pb-6">
                        <button
                            type="submit"
                            form="regForm"
                            disabled={isSubmitting}
                            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-base font-medium text-white hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all font-bold"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Registration'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
