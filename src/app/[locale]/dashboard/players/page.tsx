"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import EditModal from '@/components/admin/EditModal';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import AdminGuard from '@/components/AdminGuard';
import { Player } from '@/lib/googleSheets';

export default function PlayersPage() {
    const t = useTranslations('players');
    const tCommon = useTranslations('common');
    const { createPlayer, updatePlayer, deletePlayer } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchPlayers = async () => {
        try {
            const res = await fetch('/api/players');
            const data = await res.json();
            // Filter out any empty or invalid entries (e.g., deleted rows from Google Sheets)
            const validPlayers = data.filter((p: Player) => p.id && p.id.trim() !== '');
            setPlayers(validPlayers);
        } catch (err) {
            console.error(err);
            error(tCommon('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedPlayer({ id: '', name: '', handicap: 0, team: '' } as Player);
        setIsEditModalOpen(true);
    };

    const handleEdit = (player: Player) => {
        setIsCreating(false);
        setSelectedPlayer(player);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (player: Player) => {
        setSelectedPlayer(player);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (data: Player) => {
        try {
            if (isCreating) {
                // Don't send the id field when creating - let the API generate it
                const { id, ...playerData } = data;
                await createPlayer(playerData);
                success(t('playerAdded'));
            } else {
                await updatePlayer(data.id, data);
                success(t('playerUpdated'));
            }
            setIsEditModalOpen(false);
            fetchPlayers();
        } catch (err) {
            error(tCommon('error'));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPlayer) return;
        try {
            await deletePlayer(selectedPlayer.id);
            success(t('playerDeleted'));
            setIsDeleteModalOpen(false);
            fetchPlayers();
        } catch (err) {
            error(tCommon('error'));
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[url('/golf-bg-pattern.png')] bg-repeat bg-opacity-5">
                <ToastContainer />
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                                    {t('title')}
                                </h1>
                                <p className="text-gray-600 mt-2">Manage all registered players and their handicaps</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold transform hover:-translate-y-0.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                {t('addNew')}
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Total Players</div>
                                <div className="text-2xl font-bold text-emerald-600">{players.length}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Avg Handicap</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {players.length > 0 ? (players.reduce((sum, p) => sum + p.handicap, 0) / players.length).toFixed(1) : '0'}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Teams</div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {new Set(players.filter(p => p.team).map(p => p.team)).size}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Players Table */}
                    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">{tCommon('loading')}</p>
                            </div>
                        ) : players.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-lg">{t('noPlayers')}</p>
                                <p className="text-gray-400 text-sm mt-2">Click "Add New Player" to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Player
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Handicap
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Team
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {players.map((player) => (
                                            <tr key={player.id} className="hover:bg-emerald-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                                            {player.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900">{player.name}</div>
                                                            {player.email && <div className="text-xs text-gray-500">{player.email}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                                                        {player.handicap}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {player.team ? (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                                            {player.team}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(player)}
                                                            className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                                                        >
                                                            {tCommon('edit')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(player)}
                                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                                        >
                                                            {tCommon('delete')}
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

                <EditModal
                    isOpen={isEditModalOpen}
                    title={isCreating ? t('addNew') : t('editPlayer')}
                    data={selectedPlayer}
                    fields={[
                        { key: 'name', label: t('fields.name'), required: true },
                        { key: 'handicap', label: t('fields.handicap'), type: 'number', required: true },
                        { key: 'team', label: t('fields.team') }
                    ]}
                    onSave={handleSave}
                    onCancel={() => setIsEditModalOpen(false)}
                    saveText={tCommon('save')}
                    cancelText={tCommon('cancel')}
                />

                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    title={t('deletePlayer')}
                    message={t('confirmDelete', { name: selectedPlayer?.name })}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    confirmText={tCommon('delete')}
                    cancelText={tCommon('cancel')}
                />
            </div>
        </AdminGuard>
    );
}
