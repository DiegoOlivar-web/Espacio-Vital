import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE = 'ev_admin_session';
const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');

function sign(value) {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) throw new Error('SESSION_SECRET no configurado');
    return createHmac('sha256', secret).update(value).digest('base64url');
}
export function verifyPassword(password) {
    const stored = process.env.ADMIN_PASSWORD_HASH || '';
    const [scheme, salt, hash] = stored.split(':');
    if (scheme !== 'scrypt' || !/^[a-f\d]+$/i.test(salt||'') || !/^[a-f\d]{128}$/i.test(hash||'')) throw new Error('ADMIN_PASSWORD_HASH no configurado');
    const actual = scryptSync(password, Buffer.from(salt, 'hex'), 64);
    return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function credentialsMatch(username, password) {
    const expected = process.env.ADMIN_USERNAME || '';
    const a = Buffer.from(String(username));
    const b = Buffer.from(expected);
    const userValid = a.length === b.length && timingSafeEqual(a, b);
    const passValid = verifyPassword(String(password));
    return userValid && passValid && Boolean(expected);
}
export function issueSession(res, req) {
    const now = Math.floor(Date.now() / 1000);
    const token = b64( { iat: now, exp: now + 8 * 3600, nonce: randomBytes(8).toString('hex')} );
    const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `${COOKIE}=${token}.${sign(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure?'; Secure':''}`);
}
export function clearSession(res, req) {
    const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`);
}
export function sessionValid(req) {
    try {
        const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));

        if (!cookie) return false;
        const [payload, signature, ...extra] = cookie.slice(COOKIE.length + 1).split('.');

        if (!payload || !signature || extra.length) return false;
        const expected = Buffer.from(sign(payload));
        const supplied = Buffer.from(signature);

        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
        const token = JSON.parse(Buffer.from(payload, 'base64url').toString());

        return Number.isInteger(token.exp) && token.exp > Math.floor(Date.now() / 1000) && token.iat <= Math.floor(Date.now() / 1000);
    } catch { return false; }
}
export function sameOrigin(req) {
    const origin = req.headers.origin;
    if(!origin) return true;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    try {return new URL(origin).host === host; } catch { return false; }
}
