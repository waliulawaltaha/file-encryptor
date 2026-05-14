import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { webcrypto } from 'node:crypto';
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'crypto', {
        value: webcrypto,
        writable: true
    });
} else {
    global.crypto = webcrypto;
}
