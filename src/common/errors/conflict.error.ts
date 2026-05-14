import { BaseHttpError } from './base-http.error';

export class ConflictError extends BaseHttpError {
  constructor(message = 'Conflict') {
    super(409, message, 'Conflict');
  }
}
