"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import EditModal from '@/components/admin/EditModal';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import AdminGuard from '@/components/AdminGuard';
import { Course } from '@/lib/googleSheets';

export default function CoursesPage() {
    const t = useTranslations('courses');
    const tCommon = useTranslations('common');
    const { createCourse, updateCourse, deleteCourse } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error(err);
            error(tCommon('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleCreate = () => {
        setIsCreating(true);
        // Initialize with 18 holes of 0s
        setSelectedCourse({
            id: '',
            name: '',
            pars: Array(18).fill(4),
            distances: Array(18).fill(300)
        } as Course);
        setIsEditModalOpen(true);
    };

    const handleEdit = (course: Course) => {
        setIsCreating(false);
        setSelectedCourse(course);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (course: Course) => {
        setSelectedCourse(course);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (data: Course) => {
        try {
            // Ensure pars and distances are arrays of numbers
            const formattedData = {
                ...data,
                pars: Array.isArray(data.pars) ? data.pars.map(Number) : [],
                distances: Array.isArray(data.distances) ? data.distances.map(Number) : []
            };

            if (isCreating) {
                // Don't send the id field when creating - let the API generate it
                const { id, ...courseData } = formattedData;
                await createCourse(courseData);
                success(t('courseAdded'));
            } else {
                await updateCourse(data.id, formattedData);
                success(t('courseUpdated'));
            }
            setIsEditModalOpen(false);
            fetchCourses();
        } catch (err) {
            console.error(err);
            error(tCommon('error'));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCourse) return;
        try {
            await deleteCourse(selectedCourse.id);
            success(t('courseDeleted'));
            setIsDeleteModalOpen(false);
            fetchCourses();
        } catch (err) {
            error(tCommon('error'));
        }
    };

    // Helper to render hole inputs in the modal
    const renderHoleInputs = (
        type: 'pars' | 'distances',
        values: number[],
        onChange: (newValues: number[]) => void
    ) => {
        return (
            <div className="grid grid-cols-9 gap-2 mt-2">
                {values.map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <label className="text-xs text-gray-500">{idx + 1}</label>
                        <input
                            type="number"
                            value={val}
                            onChange={(e) => {
                                const newValues = [...values];
                                newValues[idx] = Number(e.target.value);
                                onChange(newValues);
                            }}
                            className="w-full px-1 py-1 text-center border border-gray-300 rounded text-sm"
                        />
                    </div>
                ))}
            </div>
        );
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
                                <p className="text-gray-600 mt-2">Manage golf courses and hole configurations</p>
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
                    </div>

                    {/* Courses Grid */}
                    {isLoading ? (
                        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">{tCommon('loading')}</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">{t('noCourses')}</p>
                            <p className="text-gray-400 text-sm mt-2">Add a new course to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => {
                                const totalPar = course.pars.reduce((a, b) => a + b, 0);
                                const totalDistance = course.distances?.reduce((a, b) => a + b, 0) || 0;
                                const frontPar = course.pars.slice(0, 9).reduce((a, b) => a + b, 0);
                                const backPar = course.pars.slice(9).reduce((a, b) => a + b, 0);

                                return (
                                    <div key={course.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all transform hover:-translate-y-1">
                                        {/* Course Header */}
                                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">18 Holes</span>
                                                </div>
                                                <h3 className="text-2xl font-bold truncate">{course.name}</h3>
                                            </div>
                                        </div>

                                        {/* Course Stats */}
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-xs text-blue-600 font-medium mb-1">Total Par</div>
                                                    <div className="text-2xl font-bold text-blue-700">{totalPar}</div>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <div className="text-xs text-purple-600 font-medium mb-1">Distance</div>
                                                    <div className="text-2xl font-bold text-purple-700">{totalDistance.toLocaleString()}</div>
                                                </div>
                                            </div>

                                            {/* Front/Back Nine */}
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                                <div className="text-center flex-1">
                                                    <div className="text-xs t gray-500">Front 9</div>
                                                    <div className="text-lg font-semibold text-gray-900">{frontPar}</div>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200"></div>
                                                <div className="text-center flex-1">
                                                    <div className="text-xs text-gray-500">Back 9</div>
                                                    <div className="text-lg font-semibold text-gray-900">{backPar}</div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(course)}
                                                    className="flex-1 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium border border-emerald-200"
                                                >
                                                    {tCommon('edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(course)}
                                                    className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200"
                                                >
                                                    {tCommon('delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Custom Edit Modal for Courses to handle array inputs */}
                {isEditModalOpen && selectedCourse && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                {isCreating ? t('addNew') : t('editCourse')}
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('fields.name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedCourse.name}
                                        onChange={(e) => setSelectedCourse({ ...selectedCourse, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('fields.pars')}
                                    </label>
                                    {renderHoleInputs('pars', selectedCourse.pars, (newPars) =>
                                        setSelectedCourse({ ...selectedCourse, pars: newPars })
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('fields.distances')}
                                    </label>
                                    {renderHoleInputs('distances', selectedCourse.distances || Array(18).fill(0), (newDist) =>
                                        setSelectedCourse({ ...selectedCourse, distances: newDist })
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end mt-6">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        {tCommon('cancel')}
                                    </button>
                                    <button
                                        onClick={() => handleSave(selectedCourse)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                    >
                                        {tCommon('save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    title={t('deleteCourse')}
                    message={t('confirmDelete', { name: selectedCourse?.name })}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    confirmText={tCommon('delete')}
                    cancelText={tCommon('cancel')}
                />
            </div>
        </AdminGuard>
    );
}
