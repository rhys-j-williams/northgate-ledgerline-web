export interface ApiError {
  status: number;
  code: string;
  message: string;
  correlationId: string | null;
}
