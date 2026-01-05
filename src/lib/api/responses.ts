import { NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Create a successful API response
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 * @param message - Error message
 * @param details - Additional error details (optional)
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  message: string,
  details?: any,
  status: number = 500
): NextResponse {
  const response: ApiResponse<null> = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a not found (404) error response
 * @param resource - Name of the resource that wasn't found
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(resource: string): NextResponse {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: `${resource} not found`,
    },
    { status: 404 }
  );
}

/**
 * Create a validation error (400) response
 * @param message - Validation error message
 * @param details - Validation error details (optional)
 * @returns NextResponse with 400 status
 */
export function validationErrorResponse(
  message: string,
  details?: any
): NextResponse {
  const response: ApiResponse<null> = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status: 400 });
}

/**
 * Create an unauthorized (401) error response
 * @param message - Error message (default: 'Unauthorized')
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden (403) error response
 * @param message - Error message (default: 'Forbidden')
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}
