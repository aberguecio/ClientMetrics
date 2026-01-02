/**
 * Chart Configuration Validation
 *
 * Centralized validation logic used by both UI and API.
 * Validates chart configurations against compatibility rules.
 */

import type { ChartType, AggregationType } from '@/types/charts';
import {
  getFieldMetadata,
  isFieldAggregable,
  isFieldClosedArray,
  FieldCategory,
} from './field-metadata';
import {
  getChartConfig,
  getAxisRequirement,
  isAggregationAllowed,
  AxisRole,
} from './chart-config';

/**
 * Types of validation errors
 */
export enum ValidationErrorType {
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INCOMPATIBLE_FIELD = 'incompatible_field',
  INVALID_AGGREGATION = 'invalid_aggregation',
  INCOMPATIBLE_AGGREGATION = 'incompatible_aggregation',
  UNKNOWN_FIELD = 'unknown_field',
}

/**
 * A single validation error or warning
 */
export interface ValidationError {
  type: ValidationErrorType;
  field: string;          // Which field/axis has the issue
  message: string;        // Human-readable error message
  suggestion?: string;    // Optional suggestion for fixing the issue
}

/**
 * Result of validating a chart configuration
 */
export interface ValidationResult {
  valid: boolean;                // true if no blocking errors
  errors: ValidationError[];     // Blocking errors that prevent chart creation
  warnings: ValidationError[];   // Informational warnings (chart can still be created)
}

/**
 * Chart configuration to validate
 */
export interface ChartConfigToValidate {
  name: string;
  chart_type: ChartType;
  x_axis: string;
  y_axis: string;
  group_by: string;
  aggregation: AggregationType;
}

/**
 * Validate a complete chart configuration
 *
 * Checks:
 * 1. Required fields are present
 * 2. Field compatibility with axis roles
 * 3. Aggregation validity
 * 4. Aggregation compatibility with field types
 *
 * @param config Chart configuration to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateChartConfig(config: ChartConfigToValidate): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const chartConfig = getChartConfig(config.chart_type);

  // ===== 1. VALIDATE NAME =====
  if (!config.name || config.name.trim() === '') {
    errors.push({
      type: ValidationErrorType.MISSING_REQUIRED_FIELD,
      field: 'name',
      message: 'El nombre del gráfico es requerido',
    });
  }

  if (!chartConfig) {
    errors.push({
      type: ValidationErrorType.UNKNOWN_FIELD,
      field: 'chart_type',
      message: `Tipo de gráfico no configurado: ${config.chart_type}`,
    });
    return { valid: false, errors, warnings };
  }

  // ===== 2. VALIDATE AXIS REQUIREMENTS =====
  for (const requirement of chartConfig.axisRequirements) {
    let fieldValue: string = '';

    // Map requirement role to config field
    // Note: Pie charts use group_by for CATEGORY, wordclouds use x_axis for TEXT_FIELD
    switch (requirement.role) {
      case AxisRole.X_AXIS:
      case AxisRole.TEXT_FIELD:
        fieldValue = config.x_axis || '';
        break;
      case AxisRole.Y_AXIS:
        fieldValue = config.y_axis || '';
        break;
      case AxisRole.CATEGORY:
      case AxisRole.GROUP_BY:
        fieldValue = config.group_by || '';
        break;
    }

    // Check required fields are present
    if (requirement.required && (!fieldValue || fieldValue.trim() === '')) {
      errors.push({
        type: ValidationErrorType.MISSING_REQUIRED_FIELD,
        field: requirement.role,
        message: `${requirement.description} es requerido para gráficos tipo ${chartConfig.label}`,
        suggestion: requirement.helpText,
      });
      continue; // Skip further checks for this field
    }

    // Check field compatibility (if field is provided)
    if (fieldValue && fieldValue.trim() !== '') {
      const fieldMetadata = getFieldMetadata(fieldValue);

      // Unknown field
      if (!fieldMetadata) {
        errors.push({
          type: ValidationErrorType.UNKNOWN_FIELD,
          field: requirement.role,
          message: `Campo "${fieldValue}" no existe en el sistema`,
          suggestion: 'Selecciona un campo válido de la lista',
        });
        continue;
      }

      // Check if field category is compatible with this axis role
      const isCompatible = requirement.allowedCategories.includes(fieldMetadata.category);

      if (!isCompatible) {
        errors.push({
          type: ValidationErrorType.INCOMPATIBLE_FIELD,
          field: requirement.role,
          message: `Campo "${fieldMetadata.label}" (${fieldMetadata.category}) no es compatible con ${requirement.description}`,
          suggestion: `Tipos permitidos: ${requirement.allowedCategories.join(', ')}`,
        });
      }

      // Special warning for closed arrays in pie charts
      if (
        config.chart_type === 'pie' &&
        requirement.role === AxisRole.CATEGORY &&
        fieldMetadata.category === FieldCategory.CLOSED_ARRAY
      ) {
        warnings.push({
          type: ValidationErrorType.INCOMPATIBLE_FIELD,
          field: requirement.role,
          message: `"${fieldMetadata.label}" es un campo de array cerrado. El gráfico mostrará la frecuencia de cada valor.`,
          suggestion: 'Este comportamiento puede ser correcto para análisis de frecuencia de opciones múltiples.',
        });
      }
    }
  }

  // ===== 3. VALIDATE AGGREGATION IS ALLOWED FOR CHART TYPE =====
  if (!isAggregationAllowed(config.chart_type, config.aggregation)) {
    errors.push({
      type: ValidationErrorType.INVALID_AGGREGATION,
      field: 'aggregation',
      message: `Agregación "${config.aggregation}" no está permitida para gráficos tipo ${chartConfig.label}`,
      suggestion: `Agregaciones permitidas: ${chartConfig.allowedAggregations.join(', ')}`,
    });
  }

  // ===== 4. VALIDATE AGGREGATION COMPATIBILITY WITH Y-AXIS FIELD =====
  if (config.y_axis && config.y_axis.trim() !== '' && config.y_axis !== 'count') {
    const yAxisMetadata = getFieldMetadata(config.y_axis);

    if (yAxisMetadata) {
      const isAggregable = isFieldAggregable(config.y_axis);
      const numericAggregations: AggregationType[] = ['sum', 'avg', 'min', 'max'];

      // Warning if trying to use numeric aggregation on non-numeric field
      if (!isAggregable && numericAggregations.includes(config.aggregation)) {
        warnings.push({
          type: ValidationErrorType.INCOMPATIBLE_AGGREGATION,
          field: 'aggregation',
          message: `Campo "${yAxisMetadata.label}" no es numérico. La agregación "${config.aggregation}" se convertirá automáticamente a "count".`,
          suggestion: 'Usa un campo numérico (como "Volumen de Interacción Diaria") o cambia la agregación a "count".',
        });
      }
    }
  }

  // ===== 5. WARNING FOR CLOSED ARRAYS IN BAR/LINE/AREA X-AXIS =====
  if (['bar', 'line', 'area'].includes(config.chart_type) && config.x_axis) {
    if (isFieldClosedArray(config.x_axis)) {
      const fieldMetadata = getFieldMetadata(config.x_axis);
      if (fieldMetadata) {
        warnings.push({
          type: ValidationErrorType.INCOMPATIBLE_FIELD,
          field: AxisRole.X_AXIS,
          message: `"${fieldMetadata.label}" es un campo de array cerrado. El gráfico mostrará la frecuencia de cada valor posible.`,
          suggestion: 'Esto es útil para ver qué opciones son más mencionadas (ej: qué integraciones son más solicitadas).',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get all error messages as a single string array
 * Useful for displaying in alerts or logs
 */
export function getValidationErrorMessages(result: ValidationResult): string[] {
  return [
    ...result.errors.map(e => `❌ ${e.message}`),
    ...result.warnings.map(w => `⚠️ ${w.message}`),
  ];
}