import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
  type CreateCollectionPayload,
  type UpdateCollectionPayload,
} from "@/lib/collections-api";

const COLLECTIONS_KEY = ["collections"];

export function useCollections(search?: string) {
  return useQuery({
    queryKey: [...COLLECTIONS_KEY, search],
    queryFn: () => getCollections(search),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) => createCollection(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCollectionPayload }) =>
      updateCollection(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}
