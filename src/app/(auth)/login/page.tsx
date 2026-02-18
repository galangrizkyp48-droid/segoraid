"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    let mounted = true

    useEffect(() => {
        return () => { mounted = false }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (error) throw error

            // Soft navigation with state refresh
            router.refresh()
            router.replace('/')
        } catch (err: any) {
            console.error('Login error:', err)
            // Specific error handling remains...
            if (err.message.includes('Email not confirmed')) {
                setError('Email belum dikonfirmasi. Silakan cek inbox/spam email Anda.')
            } else if (err.message === 'Invalid login credentials') {
                setError('Email atau password salah')
            } else {
                setError(err.message || 'Terjadi kesalahan login')
            }
        } finally {
            if (mounted) setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white p-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center py-8">
                    <h1 className="text-3xl font-bold text-sky-600">Segora</h1>
                    <p className="text-gray-600 mt-2">Selamat Datang Kembali!</p>
                </div>

                <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-md p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 text-white py-3 rounded-full font-semibold hover:bg-sky-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Processing...' : 'Masuk'}
                    </button>

                    <p className="text-center mt-4 text-sm">
                        Belum punya akun? <Link href="/register" className="text-sky-600 font-semibold">Daftar</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
