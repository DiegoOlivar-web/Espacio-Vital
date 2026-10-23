import { put, del } from '@vercel/blob';
import { sessionValid, sameOrigin } from './_lib/auth.js';
import { respond, method, fail } from './_lib/http.js';

// Desactivar el body parser de Vercel para poder leer el stream multipart/form-data manualmente
export const config = {
    api: {
        bodyParser: false,
    },
};


const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST  /api/upload  — recibe multipart/form-data con campo "file"
 *                      y opcionalmente "old_url" para eliminar el blob previo.
 * DELETE /api/upload  — elimina un blob por { url }
 */
export default async function handler(req, res) {
    if (!['POST', 'DELETE'].includes(req.method)) return method(req, res, ['POST', 'DELETE']);

    if (!sessionValid(req)) return respond(res, 401, { error: 'Inicia sesión para subir imágenes' });
    if (!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });

    try {
        // ── DELETE: eliminar blob existente ───────────────────────────────
        if (req.method === 'DELETE') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
            const url = String(body.url || '');
            if (!url) return respond(res, 400, { error: 'URL requerida' });
            try { await del(url); } catch (_) { /* ignorar si ya no existe */ }
            return respond(res, 200, { deleted: true });
        }

        // ── POST: subir imagen ────────────────────────────────────────────
        // Vercel parsea multipart automáticamente en el request body como Readable stream
        // pero necesitamos extraer el file manualmente del Content-Type boundary.
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return respond(res, 400, { error: 'Se esperaba multipart/form-data' });
        }

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks);

        // Extraer boundary
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/i);
        if (!boundaryMatch) return respond(res, 400, { error: 'Boundary no encontrado' });
        const boundary = '--' + boundaryMatch[1];

        const parsed = parseMultipart(raw, boundary);
        const filePart = parsed.find(p => p.name === 'file');
        const oldUrl = parsed.find(p => p.name === 'old_url')?.value || '';

        if (!filePart) return respond(res, 400, { error: 'Campo "file" requerido' });
        if (!ALLOWED_TYPES.includes(filePart.contentType)) {
            return respond(res, 400, { error: `Tipo de imagen no permitido. Permitidos: ${ALLOWED_TYPES.join(', ')}` });
        }
        if (filePart.data.length > MAX_BYTES) {
            return respond(res, 400, { error: 'La imagen supera el tamaño máximo de 5 MB' });
        }

        // Subir a Vercel Blob
        const ext = filePart.contentType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
        const filename = `ev-img-${Date.now()}.${ext}`;
        const blob = await put(filename, filePart.data, {
            access: 'public',
            contentType: filePart.contentType,
            addRandomSuffix: true,
        });

        // Eliminar el blob anterior si se proporcionó y es de Vercel Blob
        if (oldUrl && oldUrl.includes('vercel-storage.com')) {
            try { await del(oldUrl); } catch (_) { /* ignorar */ }
        }

        return respond(res, 200, { url: blob.url });
    } catch (e) {
        return fail(res, e);
    }
}

// ── Utilidad: parsear multipart/form-data manualmente ───────────────────────
function parseMultipart(buffer, boundary) {
    const bBoundary = Buffer.from(boundary);
    const parts = [];
    let start = 0;

    while (start < buffer.length) {
        const bIdx = buffer.indexOf(bBoundary, start);
        if (bIdx === -1) break;

        start = bIdx + bBoundary.length;

        // Fin del multipart
        if (buffer[start] === 0x2d && buffer[start + 1] === 0x2d) break;
        // Saltar CRLF después del boundary
        if (buffer[start] === 0x0d) start += 2;

        // Leer headers de la parte
        const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), start);
        if (headerEnd === -1) break;

        const headerStr = buffer.slice(start, headerEnd).toString('utf8');
        start = headerEnd + 4;

        // Buscar el siguiente boundary para saber dónde termina el body
        const nextBoundary = buffer.indexOf(bBoundary, start);
        const bodyEnd = nextBoundary !== -1 ? nextBoundary - 2 : buffer.length; // -2 para CRLF

        const data = buffer.slice(start, bodyEnd);
        start = nextBoundary !== -1 ? nextBoundary : buffer.length;

        // Parsear headers
        const cdMatch = headerStr.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
        const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
        const fnMatch = headerStr.match(/filename="([^"]+)"/i);

        if (!cdMatch) continue;

        parts.push({
            name: cdMatch[1],
            filename: fnMatch ? fnMatch[1] : null,
            contentType: ctMatch ? ctMatch[1].trim() : 'text/plain',
            data,
            value: ctMatch ? null : data.toString('utf8'), // texto si no es archivo
        });
    }
    return parts;
}
