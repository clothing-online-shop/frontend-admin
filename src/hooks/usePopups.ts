import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPopup,
  deletePopup,
  getPopups,
  reorderPopups,
  updatePopup,
} from "@/lib/api/popups-api";
import type {
  CreatePopupPayload,
  ListPopupsQuery,
  ReorderPopupItem,
  UpdatePopupPayload,
} from "@/types/popups-api.types";

const POPUPS_KEY = ["popups"];

export function usePopups(query: ListPopupsQuery = {}) {
  const { search, page, limit } = query;
  return useQuery({
    queryKey: [...POPUPS_KEY, search, page, limit],
    queryFn: () => getPopups(query),
  });
}

export function useCreatePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePopupPayload) => createPopup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POPUPS_KEY }),
  });
}

export function useUpdatePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePopupPayload }) =>
      updatePopup(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POPUPS_KEY }),
  });
}

export function useDeletePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePopup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POPUPS_KEY }),
  });
}

export function useReorderPopups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderPopupItem[]) => reorderPopups(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POPUPS_KEY }),
  });
}
