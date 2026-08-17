// Rejestruje hook resolvera (ts-resolve) dla `node --import`.
import { register } from 'node:module';
register('./ts-resolve.mjs', import.meta.url);
