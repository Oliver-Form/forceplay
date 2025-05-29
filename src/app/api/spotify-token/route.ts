export const runtime = 'nodejs';

// POST /api/spotify-token
import { NextResponse } from 'next/server';

export async function GET() {
  // Ensure Spotify credentials are provided
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars');
    return NextResponse.json({ error: 'Server misconfiguration: missing credentials' }, { status: 500 });
  }

  const creds = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    console.error('Spotify token fetch failed:', res.status, json);
    return NextResponse.json({ error: 'Failed to retrieve Spotify token', details: json }, { status: res.status });
  }
  return NextResponse.json({ access_token: json.access_token });
}