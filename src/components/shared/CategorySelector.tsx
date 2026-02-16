"use client"

interface CategorySelectorProps {
    type: string
    value: string
    onChange: (value: string) => void
    error?: string
}

const CATEGORIES = {
    product: ['Buku', 'Elektronik', 'Fashion', 'Makanan', 'Kendaraan', 'Perabotan', 'Stationery', 'Lainnya'],
    service: ['Desain', 'Joki Tugas', 'Print/Fotokopi', 'Les Privat', 'Foto/Video', 'Reparasi', 'Transportasi', 'Lainnya'],
    info: ['Event', 'Lomba', 'Beasiswa', 'Magang', 'Kehilangan', 'Kost', 'Lainnya']
}

export default function CategorySelector({ type, value, onChange, error }: CategorySelectorProps) {
    // @ts-ignore
    const options = CATEGORIES[type] || []

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                Kategori <span className="text-red-500">*</span>
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
            >
                <option value="">Pilih Kategori</option>
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    )
}
