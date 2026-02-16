"use client"

import { useState } from 'react'
import { X } from 'lucide-react'

interface HashtagInputProps {
    value: string[]
    onChange: (tags: string[]) => void
    maxTags?: number
}

export default function HashtagInput({ value = [], onChange, maxTags = 10 }: HashtagInputProps) {
    const [input, setInput] = useState('')

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault()
            addTag()
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1)
        }
    }

    const addTag = () => {
        const tag = input.trim().replace(/^#/, '').toLowerCase()
        if (tag && !value.includes(tag) && value.length < maxTags) {
            onChange([...value, tag])
            setInput('')
        }
    }

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                Tags / Hashtags
            </label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-sky-500">
                {value.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 bg-sky-100 text-sky-700 px-2 py-1 rounded text-sm">
                        #{tag}
                        <button type="button" onClick={() => removeTag(index)} className="hover:text-sky-900">
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={value.length === 0 ? "Misal: uibarang, kalkulus, murah (Tekan Enter)" : ""}
                    className="flex-1 outline-none min-w-[120px] bg-transparent text-sm"
                    disabled={value.length >= maxTags}
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">Maksimal {maxTags} tags.</p>
        </div>
    )
}
