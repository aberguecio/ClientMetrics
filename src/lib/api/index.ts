/**
 * API utilities for consistent request/response handling
 * @module lib/api
 */

// Response utilities
export {
  type ApiResponse,
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from './responses';

// Validation utilities
export {
  type ResourceValidationResult,
  type IdArrayValidationResult,
  type RequiredFieldsValidationResult,
  validateResourceExists,
  validateIdArray,
  validateRequiredFields,
  validateEnumValue,
} from './validators';

// Transformation utilities
export {
  transformRequestBody,
  snakeToCamel,
  camelToSnake,
  transformSnakeToCamel,
  transformCamelToSnake,
  CHART_FIELD_MAPPING,
  FILTER_FIELD_MAPPING,
  VIEW_FIELD_MAPPING,
  VALID_CHART_TYPES,
  VALID_AGGREGATIONS,
} from './transformers';
