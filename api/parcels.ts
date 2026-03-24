import type { VercelRequest, VercelResponse } from '@vercel/node';

import { assertMethod, sendError, sendJson } from './_lib/http';
import {
  acceptParcelRequestRecord,
  completeParcelDeliveryRecord,
  createParcelRecord,
  listParcels,
  updateParcelStatusRecord,
} from './_lib/repository';
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

    if (request.method === 'GET') {
      return sendJson(response, 200, await listParcels());
    }

    if (request.method === 'POST') {
      const parcel = await createParcelRecord(request.body as ParcelDraftInput);
      return sendJson(response, 201, parcel);
    }

    const body = (request.body ?? {}) as ParcelPatchBody;

    if (!body.id) {
      return sendJson(response, 400, { error: 'Parcel id is required.' });
    }

    if (body.action === 'completeDelivery') {
      const parcel = await completeParcelDeliveryRecord(body.id, body.otp ?? '');
      return sendJson(response, 200, parcel);
    }

    if (body.action === 'acceptRequest') {
      const parcel = await acceptParcelRequestRecord(body.id, body.travelerName ?? '', body.pickupPoint ?? '', body.dropPoint ?? '');
      return sendJson(response, 200, parcel);
    }

    if (body.action === 'updateStatus' && body.status) {
      const parcel = await updateParcelStatusRecord(body.id, body.status);
      return sendJson(response, 200, parcel);
    }

    return sendJson(response, 400, { error: 'Unsupported parcel update action.' });
  } catch (error) {
    return sendError(response, error);
  }
}
