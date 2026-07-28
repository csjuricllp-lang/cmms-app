export interface SyncOperationPayload {
  [key: string]: any;
}

export interface ConflictResolutionResult {
  resolvedData: any;
  hasConflict: boolean;
  rejectedFields: string[];
}

export interface SyncOperationResult {
  success: boolean;
  error?: string;
}
