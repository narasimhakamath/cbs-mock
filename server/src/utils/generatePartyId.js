import Party from '../models/Party.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomId(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export async function generatePartyId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomId(8);
    const exists = await Party.exists({ _id: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate unique party id, retry');
}
