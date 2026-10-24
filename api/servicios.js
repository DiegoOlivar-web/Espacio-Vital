import { db } from './_lib/db.js';
import { sessionValid, sameOrigin } from './_lib/auth.js';
import { respond, method, dataBody, fail } from './_lib/http.js';

const trimmed = (v, max = 255) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const integer = v => /^\d+$/.test(String(v??'')) && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
const imageValid = url => !url || url.length <= 2000;

async function list() {
    const [cats, services] = await Promise.all([
        db().query('SELECT id,nombre,descripcion FROM categorias ORDER BY id'),
        db().query('SELECT s.id,s.nombre,s.descripcion,s.imagen_url,s.categoria_id,c.nombre AS categoria FROM servicios s JOIN categorias c ON c.id=s.categoria_id ORDER BY s.id')
    ]);
    return {
        categorias: cats.rows.map(c => ({ ...c, servicios: services.rows.filter(s => s.categoria_id === c.id)})), servicios: services.rows
    };
}

export default async function handler(req, res) {
    if(!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) return method(req, res, ['GET', 'POST', 'PUT', 'DELETE']);
    try {
        if(req.method === 'GET') return respond(res, 200, await list());
        if(!sessionValid(req)) return respond(res, 401, { error: 'Inicia sesión para administrar el catálogo' });
        if(!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });

        const body = dataBody(req), entity = body.entidad;

        if(!['categoria', 'servicio'].includes(entity)) return respond(res, 400, { error: 'La entidad debe ser categoria o servicio' });
        const id = integer(body.id), nombre = trimmed(body.nombre, 150), descripcion = trimmed(body.descripcion, 1500);
        if(req.method !== 'POST' && !id) return respond(res, 400, { error: 'ID inválido' });
        if(req.method !== 'DELETE' && !nombre) return respond(res, 400, { error: 'El nombre es obligatorio' });

        if(entity==='categoria') {
            if(req.method === 'POST') {
                const r = await db().query('INSERT INTO categorias(nombre,descripcion) VALUES($1,$2) RETURNING *', [nombre, descripcion]);
                return respond(res, 201, r.rows[0]);
            }
            if(req.method === 'PUT') {
                const r = await db().query('UPDATE categorias SET nombre=$1,descripcion=$2 WHERE id=$3 RETURNING *', [nombre, descripcion , id]);return r.rowCount?respond(res, 200, r.rows[0]):respond(res, 404, { error: 'Categoría no encontrada' });
            }
            const r = await db().query('DELETE FROM categorias WHERE id=$1 RETURNING id', [id]);
            return r.rowCount?respond(res, 200, { deleted: true }):respond(res, 404, { error: 'Categoría no encontrada' });
        }

        if(req.method === 'DELETE') {
            const r = await db().query('DELETE FROM servicios WHERE id=$1 RETURNING id', [id]);
            return r.rowCount?respond(res, 200, { deleted: true }):respond(res, 404, { error: 'Servicio no encontrado' });
        }

        const categoria_id = integer(body.categoria_id), imagen_url = trimmed(body.imagen_url, 2000);

        if(!categoria_id || !imageValid(imagen_url)) return respond(res, 400, { error: 'Categoría inválida o URL de imagen demasiado larga' });

        if(req.method === 'POST') {
            const r = await db().query('INSERT INTO servicios(nombre,descripcion,imagen_url,categoria_id) VALUES($1,$2,$3,$4) RETURNING *', [nombre, descripcion, imagen_url, categoria_id]);
            return respond(res, 201, r.rows[0]);
        }
        const r = await db().query('UPDATE servicios SET nombre=$1,descripcion=$2,imagen_url=$3,categoria_id=$4 WHERE id=$5 RETURNING *',[nombre, descripcion, imagen_url, categoria_id, id]);
        return r.rowCount?respond(res, 200, r.rows[0]):respond(res, 404, { error: 'Servicio no encontrado' });
    } catch(e) {
        if(e.code === '23505') return respond(res, 409, { error: 'Ya existe un registro con ese nombre' });
        if(e.code === '23503') return respond(res, 409, { error: 'La categoría no existe o contiene servicios. Muévelos o elimínalos primero.' });
        if(e.code === '22P02') return respond(res, 400, { error: 'Datos inválidos' });
        return fail(res, e);
    }
}