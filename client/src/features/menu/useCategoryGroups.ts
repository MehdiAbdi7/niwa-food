// src/features/menu/useCategoryGroups.ts

import { useMemo } from "react";
import type { MenuCategory, MenuItem } from "@/types/menuItem";
import { CATEGORY_GROUPS } from "./categoryGroups";

export type SectionDef =
  | { kind: "category"; label: string; categoryId: string }
  | { kind: "predicate"; label: string; test: (item: MenuItem) => boolean };

export interface ResolvedGroup {
  label: string;
  categoryIds: string[];
  sectionDefs: SectionDef[] | null;
}

export function useCategoryGroups(categories: MenuCategory[] | undefined) {
  return useMemo<ResolvedGroup[]>(() => {
    if (!categories) return [];

    const active = categories.filter((c) => c.isActive);
    const usedIds = new Set<string>();
    const groupsByLabel = new Map<string, ResolvedGroup>();

    for (const config of CATEGORY_GROUPS) {
      const matching = active.filter((c) =>
        config.categoryNames.includes(c.name),
      );
      if (matching.length === 0) continue;

      matching.forEach((c) => usedIds.add(c._id));

      let sectionDefs: SectionDef[] | null;

      if (config.sections) {
        sectionDefs = config.sections.map((s) => ({
          kind: "predicate" as const,
          label: s.label,
          test: s.test,
        }));
      } else if (matching.length > 1) {
        sectionDefs = matching.map((c) => {
          // Cherche un label explicite défini dans la config,
          // sinon retombe sur le nom brut de la catégorie backend
          const explicitLabel = config.subLabels?.find(
            (sl) => sl.categoryName === c.name,
          )?.displayLabel;

          return {
            kind: "category" as const,
            label: explicitLabel ?? c.name,
            categoryId: c._id,
          };
        });
      } else {
        sectionDefs = null;
      }

      const existing = groupsByLabel.get(config.label);
      if (existing) {
        existing.categoryIds.push(...matching.map((c) => c._id));
      } else {
        groupsByLabel.set(config.label, {
          label: config.label,
          categoryIds: matching.map((c) => c._id),
          sectionDefs,
        });
      }
    }

    for (const category of active) {
      if (usedIds.has(category._id)) continue;

      const existing = groupsByLabel.get(category.name);
      if (existing) {
        existing.categoryIds.push(category._id);
      } else {
        groupsByLabel.set(category.name, {
          label: category.name,
          categoryIds: [category._id],
          sectionDefs: null,
        });
      }
    }

    return Array.from(groupsByLabel.values());
  }, [categories]);
}
