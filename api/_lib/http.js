export function respond(res, status, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(data);
}
export function method(req, res, allowed) {
    res.setHeader('Allow', allowed.join(', '));
    return respond(res, 405, { error: 'Método no permitido' });
}
export function dataBody(req) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body ?? {};
    }
export function fail(res, err) { console.error('API error',err); return respond(res,500,{error:'Error interno. Revisa la configuración del servidor.'}); }
