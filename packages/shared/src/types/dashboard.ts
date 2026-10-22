export type DashboardStats = {
  proposals: number;
  coverLetters: number;
  activeClients: number;
  invoices: number;
  aiCredits: number;
};

export type ActivityItem = {
  id: string;
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'GENERATED' | 'EXPORTED';
  entityType:
    'PROPOSAL' | 'COVER_LETTER' | 'GIG' | 'PRICING' | 'REPLY' | 'INVOICE' | 'CONTRACT' | 'CLIENT';
  entityId: string | null;
  summary: string;
  createdAt: string;
};
