import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const KEY_FILE = 'key.bin';
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

export class CryptoService {

    private static key: Buffer | null = null;
    private static dataDir: string | null = null;

    static init(dataDir?: string): void {
        if (dataDir) CryptoService.dataDir = dataDir;
        if (!CryptoService.dataDir) {
            throw new Error('CryptoService not initialized. Call CryptoService.init(dataDir) first.');
        }

        if (!fs.existsSync(CryptoService.dataDir)) {
            fs.mkdirSync(CryptoService.dataDir, { recursive: true });
        }

        const keyPath = CryptoService.getKeyPath();

        if (!fs.existsSync(keyPath)) {
            const key = crypto.randomBytes(KEY_LENGTH);
            fs.writeFileSync(keyPath, key, {mode: 0o600});
            CryptoService.key = key;
            return;
        }

        CryptoService.key = fs.readFileSync(keyPath);
    }

    private static getKey(): Buffer {
        if (!CryptoService.key) {
            throw new Error('CryptoService not initialized. Call CryptoService.init() first.');
        }
        return CryptoService.key;
    }

    private static getKeyPath(): string {
        if (!CryptoService.dataDir) {
            throw new Error('CryptoService not initialized. Call CryptoService.init(dataDir) first.');
        }
        return path.join(CryptoService.dataDir, KEY_FILE);
    }

    static encryptString(plain: string): string {
        const key = CryptoService.getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGO, key, iv, {authTagLength: AUTH_TAG_LENGTH});

        const ciphertext = Buffer.concat([
            cipher.update(plain, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
    }

    static decryptString(payload: string): string {
        const key = CryptoService.getKey();
        const data = Buffer.from(payload, 'base64');

        const iv = data.subarray(0, IV_LENGTH);
        const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
        const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGO, key, iv, {authTagLength: AUTH_TAG_LENGTH});
        decipher.setAuthTag(authTag);

        const plain = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        return plain.toString('utf8');
    }
}
