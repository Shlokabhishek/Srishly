export default function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  return response.status(200).json({
    ok: true,
    source: 'ping',
    now: new Date().toISOString(),
  });
}
