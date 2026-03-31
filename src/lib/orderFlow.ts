import type { AuthSession, Parcel, Trip, VerificationStatus } from '@/types';

type BadgeTone = 'success' | 'warning' | 'muted' | 'danger';

const ORDER_STAGES: Array<Parcel['status']> = ['requested', 'accepted', 'picked', 'in_transit', 'delivered'];

export function isApprovedVerification(status: VerificationStatus) {
  return status === 'student_verified' || status === 'aadhaar_verified';
}

export function isViewerVerified(session: AuthSession | null) {
  return Boolean(session?.user.emailVerified && session.user.idVerified);
}

export function getVerificationLabel(status: VerificationStatus) {
  if (status === 'student_verified') {
    return 'Verified Student';
  }

  if (status === 'aadhaar_verified') {
    return 'Aadhaar Verified';
  }

  return 'Verification pending';
}

export function getVerificationTone(status: VerificationStatus): BadgeTone {
  return isApprovedVerification(status) ? 'success' : 'warning';
}

export function getTravelModeLabel(mode: Trip['mode']) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function getParcelStatusLabel(status: Parcel['status']) {
  if (status === 'in_transit') {
    return 'In Transit';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getParcelStatusTone(status: Parcel['status']): BadgeTone {
  if (status === 'delivered') {
    return 'success';
  }

  if (status === 'accepted' || status === 'picked' || status === 'in_transit') {
    return 'warning';
  }

  return 'muted';
}

export function getTrustScore(rating: number, successfulDeliveries: number) {
  const weighted = Math.round(rating * 14 + Math.min(successfulDeliveries, 20) * 1.5);
  return Math.max(68, Math.min(weighted, 99));
}

export function getOrderTimeline(parcel: Parcel) {
  const currentIndex = ORDER_STAGES.indexOf(parcel.status);
  const timestamps: Record<Parcel['status'], string | undefined> = {
    requested: parcel.createdAt,
    accepted: parcel.orderStartedAt,
    picked: parcel.pickedAt,
    in_transit: parcel.inTransitAt,
    delivered: parcel.deliveredAt,
  };

  return ORDER_STAGES.map((stage, index) => ({
    key: stage,
    label: getParcelStatusLabel(stage),
    timestamp: timestamps[stage],
    state: index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'upcoming',
  }));
}
