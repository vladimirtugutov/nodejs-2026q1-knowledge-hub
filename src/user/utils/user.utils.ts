export function excludePassword<T extends { password: string }>(
  user: T,
): Omit<T, 'password'> {
  const rest = { ...user };
  delete rest.password;
  return rest as Omit<T, 'password'>;
}
