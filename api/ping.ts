export default function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  return response.status(200).json({
    ok: true,
    source: 'ping',
    release: '2026-03-26T00:00Z-marker-a1',
    now: new Date().toISOString(),
  });
}
