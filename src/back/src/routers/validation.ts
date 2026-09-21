/**
 * Erreur de validation, automatiquement sérialisée en HTTP 400
 * par l'error handler d'Express (cf. index.ts).
 */
export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Extrait et valide un paramètre d'URL non vide.
 * @throws {ValidationError} si le paramètre est absent ou vide.
 */
export function requireParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = params[name];
  if (value === undefined || value === null || value === "") {
    throw new ValidationError(`Missing required parameter: ${name}`);
  }
  if (Array.isArray(value)) {
    throw new ValidationError(`Parameter '${name}' must be a single value, received array`);
  }
  return value;
}

/**
 * Extrait et valide un paramètre d'URL convertible en nombre.
 * @throws {ValidationError} si le paramètre est absent ou non numérique.
 */
export function requireNumericParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): number {
  const value = requireParam(params, name);
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new ValidationError(`Parameter '${name}' must be a valid number`);
  }
  return num;
}

/**
 * Valide qu'un paramètre de query string optionnel, s'il est présent,
 * est bien numérique.
 */
export function optionalNumericQuery(
  query: Record<string, unknown>,
  name: string,
): number | undefined {
  const raw = query[name];
  if (raw === undefined || raw === null || raw === "") return undefined;
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new ValidationError(`Query parameter '${name}' must be a valid number`);
  }
  return num;
}

/**
 * Valide la présence de plusieurs champs dans le corps de la requête.
 * @throws {ValidationError} dès qu'un champ est absent ou vide.
 */
export function requireBodyFields(
  body: Record<string, unknown>,
  fields: string[],
): void {
  for (const field of fields) {
    if (isEmpty(body[field])) {
      throw new ValidationError(`Missing required body field: ${field}`);
    }
  }
}
