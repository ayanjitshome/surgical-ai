import { useQuery } from "@tanstack/react-query";
import { getTools, getEcosystem, getMeta, getGuidance } from "@/lib/api";

export const useTools = () => useQuery({ queryKey: ["tools"], queryFn: getTools });
export const useEcosystem = () => useQuery({ queryKey: ["ecosystem"], queryFn: getEcosystem });
export const useMeta = () => useQuery({ queryKey: ["meta"], queryFn: getMeta });
export const useGuidance = () => useQuery({ queryKey: ["guidance"], queryFn: getGuidance });
