import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    const data = await req.formData();
    const file = data.get('file') as File;
    const transformation = data.get('transformation');

    const buffer = Buffer.from(await file.arrayBuffer());

    const proofsDir = path.resolve(process.cwd(), 'verifier/proofs');
    if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });

    fs.writeFileSync(`${proofsDir}/input.wav`, buffer);
    fs.writeFileSync(`${proofsDir}/transformation.json`, transformation.toString());

    return NextResponse.json({ success: true });
}