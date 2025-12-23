"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import AdminGuard from '@/components/AdminGuard';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import RegistrationModal from '@/components/admin/RegistrationModal';
import { Tournament, Player, TournamentPlayer } from '@/lib/googleSheets';
import { Filter, Check, X, Trash2, Mail, Phone, Calendar, User, Edit, Plus } from 'lucide-react';

export default function RegistrationsPage() {
    const t = useTranslations('registrations');
    const tCommon = useTranslations('common');
    const tTournaments = useTranslations('tournaments');
    const { updateRegistration, deleteRegistration, createRegistration } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [registrations, setRegistrations] = useState<TournamentPlayer[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedTournament, setSelectedTournament] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState<TournamentPlayer | null>(null);
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [regModalMode, setRegModalMode] = useState<'create' | 'edit'>('create');
    const [editingReg, setEditingReg] = useState<TournamentPlayer | null>(null);

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

    const handleAddClick = () => {
        setRegModalMode('create');
        setEditingReg(null);
        setIsRegModalOpen(true);
    };

    const handleEditClick = (reg: TournamentPlayer) => {
        setRegModalMode('edit');
        setEditingReg(reg);
        setIsRegModalOpen(true);
    };

    const handleRegSave = async (data: Partial<TournamentPlayer> & { isGuest?: boolean }) => {
        try {
            if (regModalMode === 'create') {
                await fetch('/api/tournament-players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                success(t('registrationAdded'));
            } else {
                await updateRegistration(data.id as string, data);
                success(t('registrationUpdated'));
            }
            fetchData();
        } catch (err) {
            console.error(err);
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

    const getStatusBadge = (status: string) => {
        const styles = {
            confirmed: 'bg-green-100 text-green-800',
            paid: 'bg-emerald-100 text-emerald-800',
            pending: 'bg-yellow-100 text-yellow-800',
            withdrawn: 'bg-red-100 text-red-800',
            registered: 'bg-blue-100 text-blue-800'
        };
        return (
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
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
                        <button
                            onClick={handleAddClick}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {t('addRegistration') || 'Add Registration'}
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> {t('filterByTournament')}
                            </label>
                            <select
                                value={selectedTournament}
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 text-base bg-white text-gray-900"
                            >
                                <option value="all">{t('allTournaments')}</option>
                                {tournaments.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.date})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-64">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('fields.status')}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 text-base bg-white text-gray-900"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="paid">Paid</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Content */}
                    {isLoading ? (
                        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">{tCommon('loading')}</p>
                        </div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="p-16 text-center bg-white rounded-2xl shadow-lg border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">{t('noRegistrations')}</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new registration.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80 backdrop-blur-sm">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {t('fields.playerName')}
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {t('fields.tournament')}
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {t('fields.status')}
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {tCommon('actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredRegistrations.map((reg) => (
                                                <tr key={reg.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm">
                                                                {getPlayerName(reg).charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div
                                                                    className="text-sm font-bold text-gray-900 cursor-pointer hover:text-emerald-600"
                                                                    onClick={() => handleEditClick(reg)}
                                                                >
                                                                    {getPlayerName(reg)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{reg.team ? `Team: ${reg.team}` : (!reg.playerId ? 'Guest' : 'No Team')}</div>
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
                                                            <Mail className="w-3 h-3 text-gray-400" /> {getPlayerEmail(reg)}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                            <Phone className="w-3 h-3 text-gray-400" /> {getPlayerPhone(reg)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {getStatusBadge(reg.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {reg.status !== 'confirmed' && reg.status !== 'paid' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(reg.id, 'confirmed')}
                                                                    className="text-white bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg transition-colors shadow-sm"
                                                                    title="Approve / Confirm"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleEditClick(reg)}
                                                                className="text-gray-600 hover:text-emerald-600 p-2 bg-gray-100 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(reg)}
                                                                className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-4">
                                {filteredRegistrations.map((reg) => (
                                    <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                                                    {getPlayerName(reg).charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{getPlayerName(reg)}</h3>
                                                    <p className="text-sm text-gray-500">{reg.team ? `Team: ${reg.team}` : (!reg.playerId ? 'Guest' : 'No Team')}</p>
                                                </div>
                                            </div>
                                            <div>{getStatusBadge(reg.status)}</div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tournament:</span>
                                                <span className="font-medium">{getTournamentName(reg.tournamentId)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Contact:</span>
                                                <span className="font-medium text-right break-words max-w-[60%]">{getPlayerPhone(reg)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                                            {reg.status !== 'confirmed' && reg.status !== 'paid' ? (
                                                <button
                                                    onClick={() => handleStatusUpdate(reg.id, 'confirmed')}
                                                    className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm shadow-sm"
                                                >
                                                    <Check className="w-4 h-4" /> Confirm
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusUpdate(reg.id, 'pending')}
                                                    className="col-span-2 flex items-center justify-center gap-2 bg-yellow-500 text-white py-2 rounded-lg font-medium text-sm shadow-sm"
                                                >
                                                    Revert
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleEditClick(reg)}
                                                className="col-span-1 flex items-center justify-center bg-gray-100 text-gray-700 py-2 rounded-lg"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(reg)}
                                                className="col-span-1 flex items-center justify-center bg-red-50 text-red-600 py-2 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="fixed bottom-6 right-6 sm:hidden z-30">
                    <button
                        onClick={handleAddClick}
                        className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full shadow-lg flex items-center justify-center transform active:scale-90 transition-transform"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>

                <RegistrationModal
                    isOpen={isRegModalOpen}
                    onClose={() => setIsRegModalOpen(false)}
                    onSave={handleRegSave}
                    tournaments={tournaments}
                    players={players}
                    initialData={editingReg}
                    mode={regModalMode}
                />

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
