import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate unique filename
        const ext = file.name.split('.').pop()
        const filename = `${uuidv4()}.${ext}`

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadDir, { recursive: true })

        // Write file
        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)

        // Return public URL
        const url = `/uploads/${filename}`
        return NextResponse.json({ url }, { status: 200 })
    } catch (err: any) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
