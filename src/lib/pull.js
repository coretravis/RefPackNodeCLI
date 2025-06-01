import fs from 'fs';
import fetch from 'node-fetch';

export async function pullRefPack(id, version, dest, apiUrl) {
  if (!apiUrl) throw new Error('API URL required');
  const url = `${apiUrl}/packages/${id}?version=${version}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pull failed: ${res.status} ${res.statusText}`);
  const buffer = await res.buffer();
  fs.writeFileSync(dest, buffer);
}
