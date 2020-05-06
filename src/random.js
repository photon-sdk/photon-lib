import crypto from 'crypto';
import { promisify } from 'util';
export const randomBytes = promisify(crypto.randomBytes);
