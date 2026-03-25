export default function handler(request: { method?: string }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Method not allowed. Expected one of: GET.',
    });
  }

  return response.status(200).json({
    ok: true,
    source: 'http-check',
  });
}
