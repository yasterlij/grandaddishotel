'use client';

import { useState } from 'react';

/**
 * Shared form-submit helper for the public inquiry/booking forms.
 *
 * Guarantees the "success" state is only reached when the server actually
 * persisted the request (res.ok AND { success: true }), and exposes
 * loading/error states for inline feedback — replacing the old pattern of
 * showing a confirmation even when the fetch had failed.
 */
export function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  const submit = async (
    url: string,
    payload: unknown,
    onSuccess?: (data: any) => void
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        onSuccess?.(data);
        return true;
      }
      setError(data?.error || 'Something went wrong — please try again.');
      return false;
    } catch {
      setError('Network error — please check your connection and try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, error, submit, clearError };
}
