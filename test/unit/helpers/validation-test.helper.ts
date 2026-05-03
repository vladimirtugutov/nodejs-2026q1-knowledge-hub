import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDto<T extends object>(
  cls: new () => T,
  payload: Partial<T>,
) {
  const dto = plainToInstance(cls, payload);
  return validate(dto);
}