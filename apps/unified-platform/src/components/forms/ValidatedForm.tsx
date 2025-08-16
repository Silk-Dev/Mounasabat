'use client';

import React, { useState, useCallback } from 'react';
import { useForm, FieldValues, UseFormProps, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { SecurityValidator } from '@/lib/input-validation';
import { logger } from '@/lib/production-logger';

/**
 * Props for ValidatedForm component
 */
interface ValidatedFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  children?: React.ReactNode;
  className?: string;
  submitButtonText?: string;
  submitButtonLoadingText?: string;
  disabled?: boolean;
  resetOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
  enableClientSideValidation?: boolean;
  enableSecurityValidation?: boolean;
  formOptions?: UseFormProps<T>;
}

/**
 * Props for ValidatedInput component
 */
interface ValidatedInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  enableSecurityValidation?: boolean;
}

/**
 * Props for ValidatedTextarea component
 */
interface ValidatedTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  enableSecurityValidation?: boolean;
}

/**
 * Security validation hook
 */
function useSecurityValidation() {
  const validateInput = useCallback((value: string, type: 'general' | 'html' | 'sql' = 'general') => {
    if (!value || typeof value !== 'string') {
      return true;
    }

    try {
      return SecurityValidator.validateInput(value, type);
    } catch (error) {
      logger.warn('Security validation error:', error);
      return false;
    }
  }, []);

  const sanitizeInput = useCallback((value: string, type: 'general' | 'html' | 'sql' = 'general') => {
    if (!value || typeof value !== 'string') {
      return value;
    }

    try {
      return SecurityValidator.sanitizeInput(value, type);
    } catch (error) {
      logger.warn('Security sanitization error:', error);
      return value;
    }
  }, []);

  return { validateInput, sanitizeInput };
}

/**
 * Enhanced form component with comprehensive validation
 */
export function ValidatedForm<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  className = '',
  submitButtonText = 'Submit',
  submitButtonLoadingText = 'Submitting...',
  disabled = false,
  resetOnSuccess = false,
  showSuccessMessage = false,
  successMessage = 'Form submitted successfully!',
  enableClientSideValidation = true,
  enableSecurityValidation = true,
  formOptions = {},
}: ValidatedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { validateInput, sanitizeInput } = useSecurityValidation();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: enableClientSideValidation ? 'onChange' : 'onSubmit',
    ...formOptions,
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = form;

  // Security validation for form inputs
  const handleInputChange = useCallback((name: Path<T>, value: string) => {
    if (enableSecurityValidation && typeof value === 'string') {
      // Validate for security threats
      if (!validateInput(value, 'general')) {
        setSubmitError('Input contains potentially dangerous content. Please review your input.');
        return;
      }

      // Sanitize the input
      const sanitizedValue = sanitizeInput(value, 'general');
      if (sanitizedValue !== value) {
        setValue(name, sanitizedValue as any);
        logger.info('Input sanitized', { field: name, original: value, sanitized: sanitizedValue });
      }
    }

    // Clear previous errors
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [enableSecurityValidation, validateInput, sanitizeInput, setValue]);

  const onFormSubmit = async (data: T) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Additional security validation before submission
      if (enableSecurityValidation) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && !validateInput(value, 'general')) {
            throw new Error(`Security validation failed for field: ${key}`);
          }
        }
      }

      await onSubmit(data);

      if (showSuccessMessage) {
        setSubmitSuccess(true);
      }

      if (resetOnSuccess) {
        reset();
      }

      // Auto-hide success message after 5 seconds
      if (showSuccessMessage) {
        setTimeout(() => setSubmitSuccess(false), 5000);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      logger.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={`space-y-4 ${className}`}>
      {/* Success Message */}
      {submitSuccess && showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              form,
              onInputChange: handleInputChange,
              disabled: disabled || isSubmitting,
            } as any);
          }
          return child;
        })}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={disabled || isSubmitting || (!isValid && enableClientSideValidation)}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitButtonLoadingText}
          </>
        ) : (
          submitButtonText
        )}
      </Button>
    </form>
  );
}

/**
 * Validated input component
 */
export function ValidatedInput({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  description,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  enableSecurityValidation = true,
  form,
  onInputChange,
  ...props
}: ValidatedInputProps & { form?: any; onInputChange?: any }) {
  if (!form) {
    throw new Error('ValidatedInput must be used within ValidatedForm');
  }

  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const fieldError = errors[name];
  const fieldValue = watch(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Apply maxLength constraint
    if (maxLength && value.length > maxLength) {
      e.target.value = value.substring(0, maxLength);
    }

    // Call parent change handler for security validation
    if (onInputChange) {
      onInputChange(name, e.target.value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className={required ? 'required' : ''}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        {...register(name, {
          onChange: handleChange,
          required: required ? `${label} is required` : false,
          minLength: minLength ? {
            value: minLength,
            message: `${label} must be at least ${minLength} characters`,
          } : undefined,
          maxLength: maxLength ? {
            value: maxLength,
            message: `${label} must not exceed ${maxLength} characters`,
          } : undefined,
          pattern: pattern ? {
            value: new RegExp(pattern),
            message: `${label} format is invalid`,
          } : undefined,
        })}
        className={fieldError ? 'border-red-500 focus:border-red-500' : ''}
        aria-invalid={fieldError ? 'true' : 'false'}
        aria-describedby={description ? `${name}-description` : undefined}
        {...props}
      />

      {description && (
        <p id={`${name}-description`} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      {maxLength && (
        <p className="text-xs text-gray-500 text-right">
          {fieldValue?.length || 0}/{maxLength}
        </p>
      )}

      {fieldError && (
        <p className="text-sm text-red-600" role="alert">
          {fieldError.message}
        </p>
      )}
    </div>
  );
}

/**
 * Validated textarea component
 */
export function ValidatedTextarea({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  description,
  maxLength,
  minLength,
  rows = 4,
  enableSecurityValidation = true,
  form,
  onInputChange,
  ...props
}: ValidatedTextareaProps & { form?: any; onInputChange?: any }) {
  if (!form) {
    throw new Error('ValidatedTextarea must be used within ValidatedForm');
  }

  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const fieldError = errors[name];
  const fieldValue = watch(name);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Apply maxLength constraint
    if (maxLength && value.length > maxLength) {
      e.target.value = value.substring(0, maxLength);
    }

    // Call parent change handler for security validation
    if (onInputChange) {
      onInputChange(name, e.target.value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className={required ? 'required' : ''}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...register(name, {
          onChange: handleChange,
          required: required ? `${label} is required` : false,
          minLength: minLength ? {
            value: minLength,
            message: `${label} must be at least ${minLength} characters`,
          } : undefined,
          maxLength: maxLength ? {
            value: maxLength,
            message: `${label} must not exceed ${maxLength} characters`,
          } : undefined,
        })}
        className={fieldError ? 'border-red-500 focus:border-red-500' : ''}
        aria-invalid={fieldError ? 'true' : 'false'}
        aria-describedby={description ? `${name}-description` : undefined}
        {...props}
      />

      {description && (
        <p id={`${name}-description`} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      {maxLength && (
        <p className="text-xs text-gray-500 text-right">
          {fieldValue?.length || 0}/{maxLength}
        </p>
      )}

      {fieldError && (
        <p className="text-sm text-red-600" role="alert">
          {fieldError.message}
        </p>
      )}
    </div>
  );
}

export default ValidatedForm;