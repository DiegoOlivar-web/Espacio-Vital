import { db } from './_lib/db.js';
import { sessionValid, sameOrigin } from './_lib/auth.js';
import { respond, method, dataBody, fail } from './_lib/http.js';

const trimmed = (v, max = 255) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const integer = v => /^\d+$/.test(String(v ?? '')) && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

async function list() {
    const r = await db().query(
        'SELECT id,orden,imagen_url,eyebrow,titulo,parrafo,boton_texto,boton_href,activo FROM hero_slides ORDER BY orden ASC, id ASC'
    );
    return r.rows;
}

export default async function handler(req, res) {
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) return method(req, res, ['GET', 'POST', 'PUT', 'DELETE']);

    try {
        // GET — público, lista slides activos (o todos si ?admin=1 con sesión)
        if (req.method === 'GET') {
            const rows = await list();
            const isAdmin = req.query?.admin === '1' && sessionValid(req);
            return respond(res, 200, isAdmin ? rows : rows.filter(r => r.activo));
        }

        if (!sessionValid(req)) return respond(res, 401, { error: 'Inicia sesión para administrar el Hero Slider' });
        if (!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });

        const body = dataBody(req);

        // DELETE — eliminar slide
        if (req.method === 'DELETE') {
            const id = integer(body.id);
            if (!id) return respond(res, 400, { error: 'ID inválido' });
            const r = await db().query('DELETE FROM hero_slides WHERE id=$1 RETURNING id', [id]);
            return r.rowCount ? respond(res, 200, { deleted: true }) : respond(res, 404, { error: 'Slide no encontrado' });
        }

        // Acción especial: reordenar
        if (body.accion === 'reorder') {
            const items = body.items; // [{ id, orden }, ...]
            if (!Array.isArray(items)) return respond(res, 400, { error: 'items debe ser un array' });
            for (const item of items) {
                const id = integer(item.id);
                const orden = Number.isInteger(item.orden) && item.orden >= 0 ? item.orden : null;
                if (!id || orden === null) return respond(res, 400, { error: 'items inválidos' });
                await db().query('UPDATE hero_slides SET orden=$1 WHERE id=$2', [orden, id]);
            }
            return respond(res, 200, { reordered: true });
        }

        const titulo = trimmed(body.titulo, 300);
        const eyebrow = trimmed(body.eyebrow, 150);
        const parrafo = trimmed(body.parrafo, 3000);
        const boton_texto = trimmed(body.boton_texto, 150);
        const boton_href = trimmed(body.boton_href, 2000);
        const imagen_url = trimmed(body.imagen_url, 2000);
        const activo = body.activo === true || body.activo === 'true' || body.activo === 1;

        if (!titulo) return respond(res, 400, { error: 'El título es obligatorio' });

        // POST — crear slide nuevo
        if (req.method === 'POST') {
            // Calcular siguiente orden
            const last = await db().query('SELECT COALESCE(MAX(orden),0)+1 AS next FROM hero_slides');
            const orden = last.rows[0].next;
            const r = await db().query(
                'INSERT INTO hero_slides(orden,imagen_url,eyebrow,titulo,parrafo,boton_texto,boton_href,activo) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
                [orden, imagen_url, eyebrow, titulo, parrafo, boton_texto, boton_href, activo]
            );
            return respond(res, 201, r.rows[0]);
        }

        // PUT — actualizar slide
        const id = integer(body.id);
        if (!id) return respond(res, 400, { error: 'ID inválido' });
        const r = await db().query(
            'UPDATE hero_slides SET imagen_url=$1,eyebrow=$2,titulo=$3,parrafo=$4,boton_texto=$5,boton_href=$6,activo=$7 WHERE id=$8 RETURNING *',
            [imagen_url, eyebrow, titulo, parrafo, boton_texto, boton_href, activo, id]
        );
        return r.rowCount ? respond(res, 200, r.rows[0]) : respond(res, 404, { error: 'Slide no encontrado' });

    } catch (e) {
        return fail(res, e);
    }
}
