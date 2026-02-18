import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import sql from '@/lib/db/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const profiles = await sql`
            SELECT * FROM public.profiles WHERE id = ${session.user.id} LIMIT 1
        `
        if (!profiles[0]) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json(profiles[0])
    } catch (err) {
        console.error('Profile fetch error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
