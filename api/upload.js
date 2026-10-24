import { put, del } from '@vercel/blob';
import { sessionValid, sameOrigin } from './_lib/auth.js';
import { respond, method, fail } from './_lib/http.js';

export const config = {
    api: {
        bodyParser: false,
    },
};


const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
    if (!['POST', 'DELETE'].includes(req.method)) return method(req, res, ['POST', 'DELETE']);

    if (!sessionValid(req)) return respond(res, 401, { error: 'Inicia sesión para subir imágenes' });
    if (!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });

    try {
        if (req.method === 'DELETE') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
            const url = String(body.url || '');
            if (!url) return respond(res, 400, { error: 'URL requerida' });
            try { await del(url); } catch (_) { /* ignorar si ya no existe */ }
            return respond(res, 200, { deleted: true });
        }

        const contentType = req.headers['content-type'] || '';

        if (!contentType.startsWith('application/octet-stream')) {
        return respond(res, 400, {
            error: 'Se esperaba una imagen en formato binario'
        });
        }

        const fileType = String(req.headers['x-file-type'] || '')
        .toLowerCase()
        .trim();

        if (!ALLOWED_TYPES.includes(fileType)) {
        return respond(res, 400, {
            error: 'Tipo de imagen no permitido'
        });
        }

        let fileBuffer;

        if (Buffer.isBuffer(req.body)) {
        fileBuffer = req.body;
        } else if (req.body instanceof Uint8Array) {
        fileBuffer = Buffer.from(req.body);
        } else {
        const chunks = [];

        for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
        }

        fileBuffer = Buffer.concat(chunks);
        }

        if (!fileBuffer.length) {
        return respond(res, 400, {
            error: 'La imagen llegó vacía al servidor'
        });
        }

        if (fileBuffer.length > MAX_BYTES) {
        return respond(res, 400, {
            error: 'La imagen supera el tamaño máximo permitido'
        });
        }

        const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif',
        'image/svg+xml': 'svg'
        };

        const ext = extensions[fileType];
        const filename = `ev-img-${Date.now()}.${ext}`;

        const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: fileType,
        addRandomSuffix: true
        });

        const oldUrl = String(req.query?.old_url || '');

        if (oldUrl && oldUrl.includes('vercel-storage.com')) {
        try {
            await del(oldUrl);
        } catch (error) {
            console.warn('No se pudo eliminar la imagen anterior');
        }
        }

        return respond(res, 200, {
        url: blob.url
        });
    } catch (e) {
        return fail(res, e);
    }
}