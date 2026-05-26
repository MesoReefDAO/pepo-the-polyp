// Re-export the canonical catalog from shared/ so server + client share one source.
// The data itself lives in shared/coralTraitsCatalog.ts.
export {
  CORAL_TRAITS_URL,
  CORAL_TRAIT_CATEGORIES,
  CORAL_TRAITS_TOTAL,
} from "@shared/coralTraitsCatalog";
export type { CoralTrait, CoralTraitCategory } from "@shared/coralTraitsCatalog";
