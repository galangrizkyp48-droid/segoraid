
import { Book, Monitor, Palette, Utensils, Shirt, GraduationCap, Briefcase, MoreHorizontal } from 'lucide-react'

export const CATEGORIES = [
    { id: 'books', label: 'Buku', icon: Book, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'electronics', label: 'Elektronik', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'creative', label: 'Jasa Kreatif', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'food', label: 'Kuliner', icon: Utensils, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'fashion', label: 'Fashion', icon: Shirt, color: 'text-pink-600', bg: 'bg-pink-100' },
    { id: 'tutor', label: 'Tutor', icon: GraduationCap, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { id: 'tools', label: 'Alat', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 'others', label: 'Lainnya', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100' },
]
