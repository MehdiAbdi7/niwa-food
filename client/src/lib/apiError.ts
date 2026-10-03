// Forme du corps d'erreur renvoyé par errorResponse() côté backend, telle que
// RTK Query la place dans `error.data`. Centralisé ici pour ne pas redéfinir
// ce type dans chaque composant qui appelle .unwrap().
interface RtkQueryError {
  data?: { error?: string };
  status?: number;
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue, réessayez.",
): string {
  const apiError = err as RtkQueryError;
  return apiError?.data?.error ?? fallback;
}
