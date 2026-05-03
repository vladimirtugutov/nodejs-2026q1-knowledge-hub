import { BaseHttpError } from './base-http.error';

export class UnauthorizedError extends BaseHttpError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'Unauthorized');
  }
}
