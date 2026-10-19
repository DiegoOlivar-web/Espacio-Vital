import { credentialsMatch, issueSession, clearSession, sessionValid, sameOrigin } from './_lib/auth.js';
import { respond, method, dataBody, fail } from './_lib/http.js';

export default async function handler(req,res) {
    try {
        if(req.method === 'GET') return respond(res, 200, { authenticated: sessionValid(req) });

        if(req.method === 'DELETE') {
            if(!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });
            clearSession(res, req);
            return respond(res, 200, { authenticated: false });
        }

        if(req.method !== 'POST') return method(req, res, ['GET', 'POST', 'DELETE']);
        if(!sameOrigin(req)) return respond(res, 403, { error: 'Origen inválido' });

        const { username = '', password = '' } = dataBody(req);

        if(typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 512) return respond(res, 400, { error: 'Credenciales inválidas' });

        if(!credentialsMatch(username, password)) return respond(res, 401, { error: 'Credenciales incorrectas' });
        issueSession(res, req);
        return respond(res, 200, { authenticated: true });
    } catch(e) { return fail(res,e) }
}