import fs from 'fs';
import fetch from 'node-fetch';

export async function pushRefPack(zipPath, apiUrl, apiKey) {
  const data = fs.readFileSync(zipPath);
  const res = await fetch(`${apiUrl}/packages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'Authorization': `Bearer ${apiKey}`
    },
    body: data
  });
  if (!res.ok) {
    throw new Error(`Push failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error('Push failed: Registry did not return success');
  }
}
