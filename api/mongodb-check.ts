type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

export default async function handler(_request: unknown, response: ApiResponse) {
  try {
    await import('./lib/mongodb');
    return response.status(200).json({
      ok: true,
      source: 'mongodb-check',
      import: 'ok',
    });
  } catch (error) {
    return response.status(500).json({
      ok: false,
      source: 'mongodb-check',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
