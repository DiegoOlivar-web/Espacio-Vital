import { randomBytes,scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const rl=createInterface ({ input:process.stdin, output:process.stdout });
const password=await rl.question ('Contraseña del administrador: ');
rl.close();

if (password.length < 12) {
    console.error('Usa al menos 12 caracteres');
    process.exit(1);
}

const salt = randomBytes(16), hash = scryptSync(password, salt, 64);

console.log('ADMIN_PASSWORD_HASH=scrypt:' + salt.toString('hex') + ':' + hash.toString('hex'));
console.log('SESSION_SECRET=' + randomBytes(32).toString('hex'));