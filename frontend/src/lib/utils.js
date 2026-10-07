/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
