/**
 * Transform request body fields from snake_case to camelCase
 * @param body - Request body with snake_case fields
 * @param mapping - Field name mapping (snake_case -> camelCase)
 * @returns Transformed object with only defined fields
 *
 * @example
 * const mapping = {
 *   chart_type: 'chartType',
 *   x_axis: 'xAxis',
 *   y_axis: 'yAxis',
 * };
 * const transformed = transformRequestBody(body, mapping);
 */
export function transformRequestBody(
  body: any,
  mapping: Record<string, string>
): any {
  const result: any = {};

  for (const [snakeKey, camelKey] of Object.entries(mapping)) {
    if (body[snakeKey] !== undefined) {
      result[camelKey] = body[snakeKey];
    }
  }

  // Also include fields not in mapping (direct pass-through)
  for (const [key, value] of Object.entries(body)) {
    if (!(key in mapping) && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Convert snake_case string to camelCase
 * @param str - String in snake_case format
 * @returns String in camelCase format
 *
 * @example
 * snakeToCamel('user_name') // returns 'userName'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 * @param str - String in camelCase format
 * @returns String in snake_case format
 *
 * @example
 * camelToSnake('userName') // returns 'user_name'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transform entire object from snake_case to camelCase
 * @param obj - Object with snake_case keys
 * @returns New object with camelCase keys
 *
 * @example
 * const input = { user_name: 'John', user_email: 'john@example.com' };
 * const output = transformSnakeToCamel(input);
 * // { userName: 'John', userEmail: 'john@example.com' }
 */
export function transformSnakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformSnakeToCamel);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = typeof value === 'object' ? transformSnakeToCamel(value) : value;
  }

  return result;
}

/**
 * Transform entire object from camelCase to snake_case
 * @param obj - Object with camelCase keys
 * @returns New object with snake_case keys
 *
 * @example
 * const input = { userName: 'John', userEmail: 'john@example.com' };
 * const output = transformCamelToSnake(input);
 * // { user_name: 'John', user_email: 'john@example.com' }
 */
export function transformCamelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformCamelToSnake);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = typeof value === 'object' ? transformCamelToSnake(value) : value;
  }

  return result;
}

/**
 * Chart field mapping for transformation
 * Maps API snake_case fields to database camelCase fields
 */
export const CHART_FIELD_MAPPING = {
  chart_type: 'chartType',
  x_axis: 'xAxis',
  y_axis: 'yAxis',
  group_by: 'groupBy',
  time_group: 'timeGroup',
  k_clusters: 'kClusters',
  label_field: 'labelField',
  text_mode: 'textMode',
  chart_filter_id: 'chartFilterId',
} as const;

/**
 * Filter field mapping for transformation
 * Maps API snake_case fields to database camelCase fields
 */
export const FILTER_FIELD_MAPPING = {
  filter_data: 'filterData',
} as const;

/**
 * View field mapping for transformation
 * Maps API snake_case fields to database camelCase fields
 */
export const VIEW_FIELD_MAPPING = {
  is_default: 'isDefault',
} as const;

/**
 * Valid chart types
 */
export const VALID_CHART_TYPES = ['pie', 'bar', 'line', 'area', 'wordcloud', 'vector_cluster'] as const;

/**
 * Valid aggregation types
 */
export const VALID_AGGREGATIONS = ['count', 'sum', 'avg', 'min', 'max'] as const;
