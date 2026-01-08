// lib/dropshipping/cj-auth.ts
import fetch from 'node-fetch';

export async function getCJAccessToken(apiKey: string): Promise<string | null> {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  if (!response.ok) {
    console.error('Failed to get CJdropshipping access token:', response.statusText);
    return null;
  }
  const data = await response.json();
  return data.accessToken || null;
}

// Refresh CJdropshipping access token using refreshToken
export async function refreshCJAccessToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string } | null> {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/refreshAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    console.error('Failed to refresh CJdropshipping access token:', response.statusText);
    return null;
  }
  const data = await response.json();
  return data.data
    ? { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }
    : null;
}
