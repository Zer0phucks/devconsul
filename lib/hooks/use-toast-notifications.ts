"use client";

import { toast } from "sonner";

/**
 * Enhanced toast notification hook with preset variants
 */
export function useToastNotifications() {
  return {
    success: (message: string, description?: string) => {
      toast.success(message, {
        description,
        duration: 4000,
      });
    },

    error: (message: string, description?: string) => {
      toast.error(message, {
        description,
        duration: 5000,
      });
    },

    warning: (message: string, description?: string) => {
      toast.warning(message, {
        description,
        duration: 4500,
      });
    },

    info: (message: string, description?: string) => {
      toast.info(message, {
        description,
        duration: 4000,
      });
    },

    loading: (message: string) => {
      return toast.loading(message);
    },

    promise: <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      return toast.promise(promise, {
        loading,
        success,
        error,
      });
    },

    custom: (component: (id: string | number) => React.ReactElement, options?: { duration?: number }) => {
      return toast.custom(component, options);
    },

    dismiss: (id?: string | number) => {
      toast.dismiss(id);
    },
  };
}
