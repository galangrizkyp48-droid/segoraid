"use client"

import { Upload, X } from 'lucide-react'
import { useState, useRef } from 'react'

interface ImageUploaderProps {
    images: File[]
    previews: string[]
    onSelect: (files: File[]) => void
    onRemove: (index: number) => void
    maxImages?: number
}

export default function ImageUploader({
    images,
    previews,
    onSelect,
    onRemove,
    maxImages = 10
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onSelect(Array.from(e.target.files))
        }
        // Reset input so same file can be selected again if needed
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                Foto/Video <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Maksimal {maxImages} foto. Foto pertama akan jadi cover.</p>

            <div className="grid grid-cols-3 gap-3">
                {/* Previews */}
                {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                        <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                        />
                        {index === 0 && (
                            <div className="absolute top-2 left-2 bg-sky-600 text-white text-xs px-2 py-1 rounded">
                                Cover
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                {/* Upload Button */}
                {images.length < maxImages && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-sky-600 hover:bg-sky-50 transition">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Tambah Foto</span>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                )}
            </div>
        </div>
    )
}
