import { INITIAL_PARCEL_DRAFT } from '@/constants';
import { validateParcelDraft, validateRouteSelection } from '@/lib/validation';

describe('validation helpers', () => {
  it('rejects identical route endpoints', () => {
    expect(validateRouteSelection('Delhi', 'Delhi')).toEqual({
      toCity: 'Origin and destination must be different.',
    });
  });

  it('flags missing and invalid parcel fields', () => {
    const errors = validateParcelDraft({
      ...INITIAL_PARCEL_DRAFT,
      parcelCategory: 'Electronics',
      weight: '0',
      dimensions: 'Medium',
      declaredValue: 'Up to Rs 500',
      fromCity: 'Delhi',
      toCity: 'Delhi',
      reward: '10',
      pickupDate: '2020-01-01',
    });

    expect(errors.weight).toBe('Weight must be between 0.1 kg and 15 kg.');
    expect(errors.toCity).toBe('Origin and destination must be different.');
    expect(errors.reward).toBe('Reward must be between Rs 100 and Rs 5,000.');
    expect(errors.termsAccepted).toBe('Accept the delivery and escrow terms to continue.');
  });

  it('accepts a valid parcel request', () => {
    const errors = validateParcelDraft({
      ...INITIAL_PARCEL_DRAFT,
      parcelCategory: 'Electronics',
      weight: '1.2',
      dimensions: 'Medium',
      declaredValue: 'Rs 500 - Rs 2,000',
      fromCity: 'Delhi',
      toCity: 'Mumbai',
      reward: '650',
      pickupDate: '2099-01-01',
      description: 'Handle with care',
      termsAccepted: true,
    });

    expect(errors).toEqual({});
  });
});
