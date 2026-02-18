import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password, name, university_id, university_name, university_short_name, year } = body

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, dan nama wajib diisi' }, { status: 400 })
        }

        // Check if email already exists
        const existing = await sql`SELECT id FROM auth.users WHERE email = ${email} LIMIT 1`
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
        }

        // Hash password
        const encrypted_password = await bcrypt.hash(password, 12)

        // Create auth user
        const newUsers = await sql`
            INSERT INTO auth.users (email, encrypted_password)
            VALUES (${email}, ${encrypted_password})
            RETURNING id, email
        `
        const newUser = newUsers[0]

        // Create profile
        await sql`
            INSERT INTO public.profiles (id, email, name, university_id, university_name, university_short_name, year)
            VALUES (${newUser.id}, ${email}, ${name}, ${university_id ?? null}, ${university_name ?? null}, ${university_short_name ?? null}, ${year ?? null})
        `

        return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 })
    } catch (err: any) {
        console.error('Register error:', err)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
