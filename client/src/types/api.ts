// Forme exacte des réponses de src/utils/responseFormatter.ts côté backend.
// Toutes les query RTK Query déballent cette enveloppe via transformResponse.
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  token?: string;
}

export interface PaginatedEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Forme du corps d'erreur renvoyé par errorResponse() — utile pour typer
// les erreurs RTK Query (`error.data` côté front)
export interface ApiErrorBody {
  error: string;
  field?: string;
}
