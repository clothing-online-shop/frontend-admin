export interface CreatePromoBarPayload {
  label: string;
  highlight: string;
  linkUrl: string;
  sortOrder?: number;
  startDate: string;
  endDate: string;
}

export type UpdatePromoBarPayload = Partial<CreatePromoBarPayload>;

export interface ReorderPromoBarItem {
  id: string;
  sortOrder: number;
}

export interface ListPromoBarsQuery {
  search?: string;
  page?: number;
  limit?: number;
}
