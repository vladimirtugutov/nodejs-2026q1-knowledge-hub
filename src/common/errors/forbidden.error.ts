import { BaseHttpError } from './base-http.error';

export class ForbiddenError extends BaseHttpError {
  constructor(message = 'Forbidden') {
    super(403, message, 'Forbidden');
  }
}
