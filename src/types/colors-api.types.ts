export interface CreateColorPayload {
  name: string;
  hexCode: string;
}

export type UpdateColorPayload = Partial<CreateColorPayload>;
