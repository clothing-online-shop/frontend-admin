import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDistricts, getProvinces, getWards, syncLocations } from "@/lib/api/locations-api";

const LOCATIONS_KEY = "locations";

export function useProvinces() {
  return useQuery({
    queryKey: [LOCATIONS_KEY, "provinces"],
    queryFn: getProvinces,
  });
}

export function useDistricts(provinceId: string | undefined) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, "districts", provinceId],
    queryFn: () => getDistricts(provinceId!),
    enabled: !!provinceId,
  });
}

export function useWards(districtId: string | undefined) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, "wards", districtId],
    queryFn: () => getWards(districtId!),
    enabled: !!districtId,
  });
}

export function useSyncLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncLocations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY] }),
  });
}
