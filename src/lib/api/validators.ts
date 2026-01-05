import { NextResponse } from 'next/server';
import { notFoundResponse, validationErrorResponse } from './responses';

/**
 * Result of resource existence validation
 */
export interface ResourceValidationResult<T> {
  valid: boolean;
  resource?: T;
  error?: NextResponse;
}

/**
 * Validate that a resource exists
 * @param fetcher - Async function that fetches the resource
 * @param resourceName - Name of the resource for error messages
 * @returns Validation result with resource or error
 *
 * @example
 * const result = await validateResourceExists(
 *   () => getChartById(id),
 *   'Chart'
 * );
 * if (!result.valid) return result.error;
 * const chart = result.resource;
 */
export async function validateResourceExists<T>(
  fetcher: () => Promise<T | null>,
  resourceName: string
): Promise<ResourceValidationResult<T>> {
  const resource = await fetcher();

  if (!resource) {
    return {
      valid: false,
      error: notFoundResponse(resourceName),
    };
  }

  return {
    valid: true,
    resource,
  };
}

/**
 * Result of ID array validation
 */
export interface IdArrayValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an array of IDs
 * @param ids - Array to validate
 * @param options - Validation options (min and max length)
 * @returns Validation result
 *
 * @example
 * const result = validateIdArray(ids, { min: 1, max: 100 });
 * if (!result.valid) {
 *   return validationErrorResponse(result.error);
 * }
 */
export function validateIdArray(
  ids: unknown,
  options: { min?: number; max?: number } = { min: 1, max: 100 }
): IdArrayValidationResult {
  if (!Array.isArray(ids)) {
    return {
      valid: false,
      error: 'IDs must be an array',
    };
  }

  const min = options.min ?? 1;
  const max = options.max ?? 100;

  if (ids.length < min) {
    return {
      valid: false,
      error: `At least ${min} ID${min > 1 ? 's are' : ' is'} required`,
    };
  }

  if (ids.length > max) {
    return {
      valid: false,
      error: `Maximum ${max} IDs allowed`,
    };
  }

  return { valid: true };
}

/**
 * Result of required fields validation
 */
export interface RequiredFieldsValidationResult {
  valid: boolean;
  missing?: string[];
}

/**
 * Validate that required fields are present in request body
 * @param body - Request body object
 * @param fields - Array of required field names
 * @returns Validation result with missing fields if any
 *
 * @example
 * const result = validateRequiredFields(body, ['name', 'email']);
 * if (!result.valid) {
 *   return validationErrorResponse(
 *     `Missing required fields: ${result.missing.join(', ')}`
 *   );
 * }
 */
export function validateRequiredFields(
  body: any,
  fields: string[]
): RequiredFieldsValidationResult {
  const missing: string[] = [];

  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
    };
  }

  return { valid: true };
}

/**
 * Validate that a value is one of the allowed enum values
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field for error messages
 * @returns Validation result
 *
 * @example
 * const result = validateEnumValue(
 *   body.chart_type,
 *   ['pie', 'bar', 'line'],
 *   'chart_type'
 * );
 * if (!result.valid) {
 *   return validationErrorResponse(result.error);
 * }
 */
export function validateEnumValue(
  value: unknown,
  allowedValues: readonly string[],
  fieldName: string
): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional field
  }

  if (!allowedValues.includes(value as string)) {
    return {
      valid: false,
      error: `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`,
    };
  }

  return { valid: true };
}
