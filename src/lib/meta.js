import fetch from 'node-fetch';

export async function fetchMeta(id, version, apiUrl) {
  if (!apiUrl) throw new Error('API URL required');
  const url = `${apiUrl}/packages/${id}/meta?version=${version}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meta fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}
