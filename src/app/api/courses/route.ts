import { NextResponse } from 'next/server';
import { db, Course } from '@/lib/googleSheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
    try {
        const courses = await db.courses.getAll();
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        // Check if user is admin
        // Relaxing permission: Users can add courses
        // const userRole = (session.user as any).role;
        // if (userRole !== 'admin') {
        //    return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        // }

        const body = await request.json();
        const newCourse: Course = {
            id: Date.now().toString(),
            ...body,
        };
        await db.courses.add(newCourse);
        return NextResponse.json(newCourse);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add course' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        // Check if user is admin
        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        const success = await db.courses.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Course not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        // Check if user is admin
        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        const success = await db.courses.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
