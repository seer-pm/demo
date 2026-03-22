export interface NotifierSuccess<T> {
  status: true;
  data: T;
}

export interface NotifierError {
  status: false;
  error: unknown;
}

export type NotifierResult<T> = NotifierSuccess<T> | NotifierError;

// Generic, UI-agnostic notification function used by consumers of the SDK
// (e.g. React apps with toast libraries).
// Implementations choose the concrete config shape.
// biome-ignore lint/suspicious/noExplicitAny:
export type NotifierFn = <T>(execute: () => Promise<T>, config?: any) => Promise<NotifierResult<T>>;
