"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { CAMPUSES } from '@/lib/constants/campuses'

const registerSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().regex(/^08\d{8,11}$/, 'Format nomor tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
    universityId: z.string().min(1, 'Pilih universitas'),
    year: z.string().optional(),
    agreedToTerms: z.boolean().refine(val => val === true, 'Harus setuju dengan syarat'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
})

export default function RegisterPage() {
    const router = useRouter()
    const { setUser } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: any) => {
        setLoading(true)
        setError('')

        try {
            // Find university name from ID
            const campus = CAMPUSES.find(c => c.id === data.universityId)
            const university_name = campus?.name ?? data.universityId
            const university_short_name = data.universityId.toUpperCase()

            // Register via API route
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    phone: data.phone,
                    university_id: data.universityId,
                    university_name,
                    university_short_name,
                    year: data.year ? parseInt(data.year) : null,
                }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Registrasi gagal')

            toast.success('Akun berhasil dibuat! Silakan login.')

            // Auto-login after register
            const signInResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (signInResult?.ok) {
                const profileRes = await fetch('/api/profile/me')
                if (profileRes.ok) {
                    const profile = await profileRes.json()
                    setUser(profile)
                }
                router.replace('/')
            } else {
                router.replace('/login')
            }
        } catch (err: any) {
            console.error('Register error:', err)
            setError(err.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white p-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center py-8">
                    <h1 className="text-3xl font-bold text-sky-600">Segora</h1>
                    <p className="text-gray-600 mt-2">Buat Akun Baru</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                        <input {...register('name')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" {...register('email')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">No. HP</label>
                        <input type="tel" {...register('phone')} placeholder="08xxxxxxxxxx" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Universitas</label>
                        <select {...register('universityId')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                            <option value="">Pilih Universitas</option>
                            {CAMPUSES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.universityId && <p className="text-red-500 text-xs mt-1">{errors.universityId.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Angkatan (opsional)</label>
                        <input type="number" {...register('year')} placeholder="2022" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" {...register('password')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
                        <input type="password" {...register('confirmPassword')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
                    </div>

                    <div className="flex items-start gap-2">
                        <input type="checkbox" {...register('agreedToTerms')} id="terms" className="mt-1" />
                        <label htmlFor="terms" className="text-sm text-gray-600">
                            Saya setuju dengan <span className="text-sky-600 font-semibold">Syarat & Ketentuan</span>
                        </label>
                    </div>
                    {errors.agreedToTerms && <p className="text-red-500 text-xs">{errors.agreedToTerms.message as string}</p>}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 text-white py-3 rounded-full font-semibold hover:bg-sky-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Mendaftar...' : 'Daftar'}
                    </button>

                    <p className="text-center text-sm">
                        Sudah punya akun? <Link href="/login" className="text-sky-600 font-semibold">Masuk</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
