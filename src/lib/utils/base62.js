import { randomInt } from 'crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = ALPHABET.length; // 62

/**
 * Convert a non-negative integer ID into a Base62 string.
 * @param {number} id - A non-negative integer.
 * @returns {string} The Base62-encoded representation.
 */
export function encode(id) {
  if (!Number.isInteger(id) || id < 0) {
    throw new TypeError('encode expects a non-negative integer');
  }

  if (id === 0) return ALPHABET[0];

  let num = id;
  let result = '';
  while (num > 0) {
    result = ALPHABET[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
}

/**
 * Convert a Base62 string back into its original numeric ID.
 * @param {string} str - A Base62-encoded string.
 * @returns {number} The decoded integer.
 */
export function decode(str) {
  if (typeof str !== 'string' || str.length === 0) {
    throw new TypeError('decode expects a non-empty string');
  }

  let num = 0;
  for (const char of str) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new RangeError(`Invalid Base62 character: "${char}"`);
    }
    num = num * BASE + value;
  }
  return num;
}

/**
 * Generate a random, collision-resistant Base62 string.
 *
 * Use as a fallback when sequential IDs aren't available. With the default
 * length of 7, the keyspace is 62^7 (~3.5 trillion), making accidental
 * collisions extremely unlikely. Callers should still confirm uniqueness
 * against the database and retry on the rare collision.
 *
 * @param {number} [length=7] - Number of characters to generate.
 * @returns {string} A random Base62 string.
 */
export function generateRandomCode(length = 7) {
  if (!Number.isInteger(length) || length < 1) {
    throw new TypeError('generateRandomCode expects a positive integer length');
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    // randomInt uses a CSPRNG and avoids modulo bias.
    result += ALPHABET[randomInt(BASE)];
  }
  return result;
}
