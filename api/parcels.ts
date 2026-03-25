import type { VercelRequest, VercelResponse } from '@vercel/node';

import { assertMethod, sendError, sendJson } from './_lib/http';
import type { ParcelDraftInput, ParcelStatus } from '../src/types';

interface ParcelPatchBody {
  action?: 'acceptRequest' | 'completeDelivery' | 'updateStatus';
  id?: string;
  otp?: string;
  status?: ParcelStatus;
  travelerName?: string;
  pickupPoint?: string;
  dropPoint?: string;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    assertMethod(request.method, ['GET', 'POST', 'PATCH']);
    const repository = await import('./_lib/repository');

    if (request.method === 'GET') {
      return sendJson(response, 200, await repository.listParcels());
    }

    if (request.method === 'POST') {
      const parcel = await repository.createParcelRecord(request.body as ParcelDraftInput);
      return sendJson(response, 201, parcel);
    }

    const body = (request.body ?? {}) as ParcelPatchBody;

    if (!body.id) {
      return sendJson(response, 400, { error: 'Parcel id is required.' });
    }

    if (body.action === 'completeDelivery') {
      const parcel = await repository.completeParcelDeliveryRecord(body.id, body.otp ?? '');
      return sendJson(response, 200, parcel);
    }

    if (body.action === 'acceptRequest') {
      const parcel = await repository.acceptParcelRequestRecord(body.id, body.travelerName ?? '', body.pickupPoint ?? '', body.dropPoint ?? '');
      return sendJson(response, 200, parcel);
    }

    if (body.action === 'updateStatus' && body.status) {
      const parcel = await repository.updateParcelStatusRecord(body.id, body.status);
      return sendJson(response, 200, parcel);
    }

    return sendJson(response, 400, { error: 'Unsupported parcel update action.' });
  } catch (error) {
    return sendError(response, error);
  }
}
