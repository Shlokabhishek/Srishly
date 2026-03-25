import type { ParcelDraftInput } from '@/types';

const PARCELS_STORAGE_KEY = 'srishly.parcels';

function makeDraft(): ParcelDraftInput {
  return {
    parcelCategory: 'Books',
    weight: '1.5',
    dimensions: 'Small',
    declaredValue: 'Up to Rs 500',
    pickupAddress: '',
    dropoffAddress: '',
    fromCity: 'Delhi',
    toCity: 'Noida',
    reward: '250',
    pickupDate: '2099-01-01',
    description: 'Exam books',
    photoNames: [],
    termsAccepted: true,
  };
}

describe('mockApi shared persistence behavior', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does not silently store parcels locally when the shared API is unavailable outside local frontend-only development', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', '');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { createParcel } = await import('./mockApi');

    await expect(createParcel(makeDraft())).rejects.toThrow(
      'Shared parcel data is unavailable right now. Please reconnect the API so requests sync across devices.',
    );
    expect(window.localStorage.getItem(PARCELS_STORAGE_KEY)).toBeNull();
  });

  it('keeps the local fallback available for frontend-only local development', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_API_BASE_URL', '');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { createParcel } = await import('./mockApi');

    const parcel = await createParcel(makeDraft());
    const storedParcels = JSON.parse(window.localStorage.getItem(PARCELS_STORAGE_KEY) ?? '[]') as Array<{ id: string }>;

    expect(parcel.id).toMatch(/^parcel-/);
    expect(storedParcels[0]?.id).toBe(parcel.id);
  });

  it('retries transient GET failures before surfacing an error', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.com/api');

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'temporary outage' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'parcel-1', status: 'posted' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const { getParcels } = await import('./mockApi');
    const parcels = await getParcels();

    expect(parcels).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
