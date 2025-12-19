"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import EditModal from '@/components/admin/EditModal';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import AdminGuard from '@/components/AdminGuard';
import { Tournament, Course } from '@/lib/googleSheets';
import Link from 'next/link';

export default function TournamentsPage() {
    const t = useTranslations('tournaments');
    const tCommon = useTranslations('common');
    const { createTournament, updateTournament, deleteTournament } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchData = async () => {
        try {
            const [tournamentsRes, coursesRes] = await Promise.all([
                fetch('/api/tournaments'),
                fetch('/api/courses')
            ]);
            const tournamentsData = await tournamentsRes.json();
            const coursesData = await coursesRes.json();

            // Filter out empty/invalid tournaments
            const validTournaments = tournamentsData.filter((t: Tournament) => t.id && t.id.trim() !== '');
            setTournaments(validTournaments);
            setCourses(coursesData);
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

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedTournament({
            id: '',
            name: '',
            date: new Date().toISOString().split('T')[0],
            courseId: courses[0]?.id || '',
            status: 'upcoming',
            scoringSystem: 'stroke'
        } as Tournament);
        setIsEditModalOpen(true);
    };

    const handleEdit = (tournament: Tournament) => {
        setIsCreating(false);
        setSelectedTournament(tournament);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (tournament: Tournament) => {
        setSelectedTournament(tournament);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (data: Tournament) => {
        try {
            if (isCreating) {
                // Don't send the id field when creating - let the API generate it
                const { id, ...tournamentData } = data;
                await createTournament(tournamentData);
                success(t('tournamentAdded'));
            } else {
                await updateTournament(data.id, data);
                success(t('tournamentUpdated'));
            }
            setIsEditModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            error(tCommon('error'));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedTournament) return;
        try {
            await deleteTournament(selectedTournament.id);
            success(t('tournamentDeleted'));
            setIsDeleteModalOpen(false);
            fetchData();
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                                    {t('title')}
                                </h1>
                                <p className="text-gray-600 mt-2">Organize and manage golf tournaments</p>
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

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Total Tournaments</div>
                                <div className="text-2xl font-bold text-emerald-600">{tournaments.length}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Active</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {tournaments.filter(t => t.status === 'active').length}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">Upcoming</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {tournaments.filter(t => t.status === 'upcoming').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tournaments Grid */}
                    {isLoading ? (
                        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">{tCommon('loading')}</p>
                        </div>
                    ) : tournaments.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">{t('noTournaments')}</p>
                            <p className="text-gray-400 text-sm mt-2">Create your first tournament to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map((tournament) => {
                                const courseName = courses.find(c => c.id === tournament.courseId)?.name || 'Unknown Course';
                                const statusConfig = {
                                    active: { bg: 'bg-green-500', text: 'text-green-600', badgeBg: 'bg-green-100', icon: '🏌️' },
                                    upcoming: { bg: 'bg-blue-500', text: 'text-blue-600', badgeBg: 'bg-blue-100', icon: '📅' },
                                    completed: { bg: 'bg-gray-500', text: 'text-gray-600', badgeBg: 'bg-gray-100', icon: '✓' }
                                };
                                const config = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.upcoming;

                                return (
                                    <div key={tournament.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all transform hover:-translate-y-1">
                                        {/* Tournament Header */}
                                        <div className={`bg-gradient-to-r from-${config.bg.replace('bg-', '')}-500 to-${config.bg.replace('bg-', '')}-600 p-6 text-white relative overflow-hidden`}
                                            style={{
                                                background: tournament.status === 'active'
                                                    ? 'linear-gradient(to right, rgb(34 197 94), rgb(22 163 74))'
                                                    : tournament.status === 'completed'
                                                        ? 'linear-gradient(to right, rgb(107 114 128), rgb(75 85 99))'
                                                        : 'linear-gradient(to right, rgb(59 130 246), rgb(37 99 235))'
                                            }}>
                                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                                        {config.icon} {t(`status.${tournament.status}`)}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-bold truncate">{tournament.name}</h3>
                                            </div>
                                        </div>

                                        {/* Tournament Info */}
                                        <div className="p-6">
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{tournament.date}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-sm font-medium truncate">{courseName}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{t(`scoringSystem.${tournament.scoringSystem || 'stroke'}`)}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                                <Link
                                                    href={`/dashboard/tournaments/${tournament.id}`}
                                                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-md transition-all text-center font-medium flex items-center justify-center gap-2"
                                                >
                                                    Manage & Score
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(tournament)}
                                                        className="flex-1 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium border border-emerald-200"
                                                    >
                                                        {tCommon('edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(tournament)}
                                                        className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200"
                                                    >
                                                        {tCommon('delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <EditModal
                    isOpen={isEditModalOpen}
                    title={isCreating ? t('addNew') : t('editTournament')}
                    data={selectedTournament}
                    fields={[
                        { key: 'name', label: t('fields.name'), required: true },
                        { key: 'date', label: t('fields.date'), type: 'text', required: true },
                        {
                            key: 'courseId',
                            label: t('fields.course'),
                            type: 'select',
                            options: courses.map(c => ({ value: c.id, label: c.name })),
                            required: true
                        },
                        {
                            key: 'status',
                            label: t('fields.status'),
                            type: 'select',
                            options: [
                                { value: 'upcoming', label: t('status.upcoming') },
                                { value: 'active', label: t('status.active') },
                                { value: 'completed', label: t('status.completed') }
                            ],
                            required: true
                        },
                        {
                            key: 'scoringSystem',
                            label: t('fields.scoringSystem'),
                            type: 'select',
                            options: [
                                { value: 'stroke', label: t('scoringSystem.stroke') },
                                { value: 'stableford', label: t('scoringSystem.stableford') },
                                { value: '36system', label: t('scoringSystem.36system') },
                                { value: 'callaway', label: t('scoringSystem.callaway') }
                            ],
                            required: true
                        }
                    ]}
                    onSave={handleSave}
                    onCancel={() => setIsEditModalOpen(false)}
                    saveText={tCommon('save')}
                    cancelText={tCommon('cancel')}
                />

                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    title={t('deleteTournament')}
                    message={t('confirmDelete', { name: selectedTournament?.name })}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    confirmText={tCommon('delete')}
                    cancelText={tCommon('cancel')}
                />
            </div>
        </AdminGuard>
    );
}
