"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

// Schema validation
const registerSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().regex(/^08\d{8,11}$/, 'Format nomor tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
    universityId: z.string().min(1, 'Pilih universitas'), // In real app, this would be a select
    year: z.string().optional(),
    agreedToTerms: z.boolean().refine(val => val === true, 'Harus setuju dengan syarat'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
})

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: any) => {
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        phone: data.phone,
                        universityId: data.universityId,
                        universityName: data.universityId === 'UI' ? 'Universitas Indonesia' :
                            data.universityId === 'ITB' ? 'Institut Teknologi Bandung' :
                                data.universityId === 'UGM' ? 'Universitas Gadjah Mada' : data.universityId,
                        universityShortName: data.universityId,
                    }
                }
            })

            if (error) throw error

            toast.success('Registrasi berhasil! Cek email untuk verifikasi akun Anda.', {
                duration: 5000,
            })

            // 4. Redirect to home (or login if email verification is enforced)
            router.push('/')

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Terjadi kesalahan saat mendaftar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white p-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center py-8">
                    <h1 className="text-3xl font-bold text-sky-600">Segora</h1>
                    <p className="text-gray-600 mt-2">Jual Beli Apapun, Sesama Mahasiswa</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-md p-6">

                    {/* Name Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="Nama yang akan ditampilkan"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name?.message as string}</p>}
                    </div>

                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="email@student.ac.id"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email?.message as string}</p>}
                    </div>

                    {/* Phone Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Nomor WhatsApp</label>
                        <input
                            {...register('phone')}
                            type="tel"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="08xxxxxxxxxx"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone?.message as string}</p>}
                    </div>

                    {/* Password Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="Minimal 8 karakter"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password?.message as string}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Konfirmasi Password</label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword?.message as string}</p>}
                    </div>

                    {/* University Select Mock */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Universitas</label>
                        <select {...register('universityId')} className="w-full px-4 py-2 border rounded-lg outline-none">
                            <option value="">Pilih Universitas</option>
                            <option value="UI">Universitas Indonesia</option>
                            <option value="ITB">Institut Teknologi Bandung</option>
                            <option value="UGM">Universitas Gadjah Mada</option>
                            <option value="Other">Lainnya</option>
                        </select>
                        {errors.universityId && <p className="text-red-500 text-xs mt-1">{errors.universityId?.message as string}</p>}
                    </div>

                    {/* Year Select */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Angkatan (Optional)</label>
                        <select {...register('year')} className="w-full px-4 py-2 border rounded-lg outline-none">
                            <option value="">Pilih angkatan</option>
                            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="mb-6">
                        <label className="flex items-start">
                            <input {...register('agreedToTerms')} type="checkbox" className="mt-1 mr-2" />
                            <span className="text-sm">
                                Saya setuju dengan <a href="#" className="text-sky-600">Syarat & Ketentuan</a> dan <a href="#" className="text-sky-600">Kebijakan Privasi</a>
                            </span>
                        </label>
                        {errors.agreedToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreedToTerms?.message as string}</p>}

                        <div className="mt-3 p-3 bg-sky-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                                🔒 <strong>Privasi Aman:</strong> Data kamu hanya digunakan untuk pengalaman di Segora. Kami TIDAK PERNAH menjual data ke pihak ketiga.
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 text-white py-3 rounded-full font-semibold hover:bg-sky-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Mendaftar...' : 'Daftar'}
                    </button>

                    {/* Login Link */}
                    <p className="text-center mt-4 text-sm">
                        Sudah punya akun? <Link href="/login" className="text-sky-600 font-semibold">Masuk</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
