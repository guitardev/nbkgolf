"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import AdminGuard from '@/components/AdminGuard';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import { Tournament, Player, TournamentPlayer } from '@/lib/googleSheets';
import { Filter, Check, X, Trash2, Mail, Phone, Calendar, User } from 'lucide-react';

export default function RegistrationsPage() {
    const t = useTranslations('registrations');
    const tCommon = useTranslations('common');
    const tTournaments = useTranslations('tournaments');
    const { updateRegistration, deleteRegistration } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [registrations, setRegistrations] = useState<TournamentPlayer[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedTournament, setSelectedTournament] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState<TournamentPlayer | null>(null);

    const fetchData = async () => {
        try {
            const [regRes, tournRes, playersRes] = await Promise.all([
                fetch('/api/tournament-players'),
                fetch('/api/tournaments'),
                fetch('/api/players')
            ]);

            const regData = await regRes.json();
            const tournData = await tournRes.json();
            const playersData = await playersRes.json();

            setRegistrations(regData);
            setTournaments(tournData);
            setPlayers(playersData);
        } catch (err) {
            console.error(err);
            error(tCommon('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateRegistration(id, { status: newStatus });
            success(t('registrationUpdated'));
            fetchData();
        } catch (err) {
            console.error(err);
            error(t('updateFailed') || tCommon('error'));
        }
    };

    const handleDeleteClick = (reg: TournamentPlayer) => {
        setRegistrationToDelete(reg);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!registrationToDelete) return;
        try {
            await deleteRegistration(registrationToDelete.id);
            success(t('registrationDeleted'));
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (err) {
            error(tCommon('error'));
        }
    };

    // Filter Logic
    const filteredRegistrations = registrations.filter(reg => {
        if (selectedTournament !== 'all' && reg.tournamentId !== selectedTournament) return false;
        if (selectedStatus !== 'all' && reg.status !== selectedStatus) return false;
        return true;
    });

    // Helper to get names
    const getPlayerName = (reg: TournamentPlayer) => {
        if (reg.playerId) {
            return players.find(p => p.id === reg.playerId)?.name || 'Unknown Player';
        }
        return reg.guestName || 'Unknown Guest';
    };

    const getPlayerEmail = (reg: TournamentPlayer) => {
        if (reg.playerId) {
            return players.find(p => p.id === reg.playerId)?.email || '-';
        }
        return reg.guestEmail || '-';
    };

    const getPlayerPhone = (reg: TournamentPlayer) => {
        if (reg.playerId) {
            return players.find(p => p.id === reg.playerId)?.phone || '-';
        }
        return reg.guestPhone || '-';
    };

    const getTournamentName = (tournamentId: string) => {
        return tournaments.find(t => t.id === tournamentId)?.name || 'Unknown Tournament';
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[url('/golf-bg-pattern.png')] bg-repeat bg-opacity-5">
                <ToastContainer />
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
                            <p className="text-gray-500 mt-1">Manage tournament registrations and approvals</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> {t('filterByTournament')}
                            </label>
                            <select
                                value={selectedTournament}
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="all">{t('allTournaments')}</option>
                                {tournaments.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.date})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-64">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('fields.status')}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="paid">Paid</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">{tCommon('loading')}</p>
                            </div>
                        ) : filteredRegistrations.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                {t('noRegistrations')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('fields.playerName')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('fields.tournament')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('fields.status')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {tCommon('actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRegistrations.map((reg) => (
                                            <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                                            {getPlayerName(reg).charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{getPlayerName(reg)}</div>
                                                            <div className="text-sm text-gray-500">{reg.team ? `Team: ${reg.team}` : 'No Team'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">{getTournamentName(reg.tournamentId)}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {tournaments.find(t => t.id === reg.tournamentId)?.date || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Mail className="w-3 h-3" /> {getPlayerEmail(reg)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <Phone className="w-3 h-3" /> {getPlayerPhone(reg)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'confirmed' || reg.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            reg.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {reg.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        {reg.status !== 'confirmed' && reg.status !== 'paid' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(reg.id, 'confirmed')}
                                                                className="text-white bg-emerald-600 hover:bg-emerald-700 p-2 rounded-lg transition-colors"
                                                                title="Approve / Confirm"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {reg.status !== 'pending' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(reg.id, 'pending')}
                                                                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Set to Pending"
                                                            >
                                                                <span className="text-xs font-bold">?</span>
                                                            </button>
                                                        )}
                                                        {reg.status !== 'withdrawn' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(reg.id, 'withdrawn')}
                                                                className="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Withdraw"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteClick(reg)}
                                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    title={t('deleteRegistration')}
                    message={t('confirmDelete')}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    confirmText={tCommon('delete')}
                    cancelText={tCommon('cancel')}
                />
            </div>
        </AdminGuard>
    );
}
