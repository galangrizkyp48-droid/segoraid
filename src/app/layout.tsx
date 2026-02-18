import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Segora - Jual Beli Sesama Mahasiswa',
  description: 'Marketplace khusus mahasiswa untuk jual beli barang dan jasa.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={cn(inter.className, "bg-gray-50 min-h-screen")}>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
