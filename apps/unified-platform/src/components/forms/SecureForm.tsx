'use client';

import React, { FormEvent, ReactNode } from 'react';
import { useCSRFToken } from '@/hooks/useCSRFToken';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>, csrfHeaders: Record<string, string>) => void | Promise<void>;
  className?: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action?: string;
  encType?: string;
  disabled?: boolean;
  showCSRFError?: boolean;
}

export function SecureForm({
  children,
  onSubmit,
  className,
  method = 'POST',
  action,
  encType,
  disabled = false,
  showCSRFError = true,
}: SecureFormProps) {
  const { token, secret, isLoading, error, getHeaders } = useCSRFToken();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isLoading || !token || !secret) {
      return;
    }

    const csrfHeaders = getHeaders();
    await onSubmit(event, csrfHeaders);
  };

  // Show loading state while CSRF token is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-muted-foreground">
          Initializing secure form...
        </span>
      </div>
    );
  }

  // Show error if CSRF token failed to load
  if (error && showCSRFError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Security initialization failed: {error}
          <br />
          Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      method={method}
      action={action}
      encType={encType}
    >
      {/* Hidden CSRF token fields for non-JS fallback */}
      {token && secret && (
        <>
          <input type="hidden" name="csrf_token" value={token} />
          <input type="hidden" name="csrf_secret" value={secret} />
        </>
      )}
      
      <fieldset disabled={disabled || isLoading || !token || !secret}>
        {children}
      </fieldset>
    </form>
  );
}

// Higher-order component for wrapping existing forms with CSRF protection
export function withCSRFProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function CSRFProtectedComponent(props: P) {
    const { getHeaders, isLoading, error } = useCSRFToken();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading security features...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Security initialization failed. Please refresh the page.
          </AlertDescription>
        </Alert>
      );
    }

    return <WrappedComponent {...props} csrfHeaders={getHeaders()} />;
  };
}

// Secure form input component with built-in sanitization
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
}

export function SecureInput({ 
  sanitize = true, 
  onChange, 
  ...props 
}: SecureInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (sanitize && onChange) {
      // Basic client-side sanitization (server-side is still required)
      const sanitizedValue = event.target.value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      const sanitizedEvent = {
        ...event,
        target: {
          ...event.target,
          value: sanitizedValue,
        },
      };
      
      onChange(sanitizedEvent);
    } else if (onChange) {
      onChange(event);
    }
  };

  return (
    <input
      {...props}
      onChange={handleChange}
    />
  );
}

// Secure textarea component
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
}

export function SecureTextarea({ 
  sanitize = true, 
  onChange, 
  ...props 
}: SecureTextareaProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (sanitize && onChange) {
      // Basic client-side sanitization
      const sanitizedValue = event.target.value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      const sanitizedEvent = {
        ...event,
        target: {
          ...event.target,
          value: sanitizedValue,
        },
      };
      
      onChange(sanitizedEvent);
    } else if (onChange) {
      onChange(event);
    }
  };

  return (
    <textarea
      {...props}
      onChange={handleChange}
    />
  );
}