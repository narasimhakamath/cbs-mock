import User from '../models/User.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomId(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export async function generateUserId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `U${randomId(7)}`;
    const exists = await User.exists({ _id: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate unique user id, retry');
}
