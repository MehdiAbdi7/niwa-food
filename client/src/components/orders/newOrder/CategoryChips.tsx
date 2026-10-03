import type { MenuSection } from "@/features/publicOrder/menuBlocks";
import { subAnchorId } from "@/features/publicOrder/menuBlocks";

interface CategoryChipsProps {
  sections: MenuSection[];
  /** Label de la section en cours de lecture, désigné par le scroll-spy. */
  activeGroup: string | null;
  /** Clé du bloc en cours de lecture, ou null si on est sur le titre de section. */
  activeSubKey: string | null;
  onNavigate: (anchorId: string) => void;
}

// Niveau 1 : pilule pleine, bordure marquée. C'est le repère principal.
function GroupChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // aria-current et non aria-pressed : ces pastilles ne sont pas des
      // interrupteurs, elles désignent la section où l'on se trouve.
      aria-current={isActive ? "true" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
        isActive
          ? "border-primary bg-primary text-on-primary"
          : "border-border-subtle bg-surface text-foreground/70 hover:border-primary hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`tabular-nums rounded-full px-1.5 text-xs ${
          isActive ? "bg-on-primary/20" : "bg-surface-2 text-foreground/75"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// Niveau 2 : onglet à coins carrés, souligné quand actif. Forme et poids
// différents du niveau 1 — la hiérarchie se lit sans comparer deux nuances de
// la même couleur.
function SubChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent text-foreground/90 hover:bg-surface-2 hover:text-primary/80"
      }`}
    >
      {label}
      <span className="tabular-nums text-xs opacity-60">{count}</span>
    </button>
  );
}

/**
 * Navigation de la carte — ce n'est plus un filtre.
 *
 * Cliquer fait DÉFILER jusqu'à la section, sans jamais masquer le reste du
 * menu : c'est le comportement de la carte publique. En prise de commande au
 * comptoir, ça supprime l'aller-retour « filtrer, ne pas trouver, revenir à
 * Tout le menu », et l'équipe garde en périphérie des produits qu'elle n'aurait
 * pas pensé à proposer.
 *
 * Plus de pastille « Tout le menu » : tout le menu est TOUJOURS affiché, un
 * bouton pour l'afficher n'a plus rien à désigner.
 */
export function CategoryChips({
  sections,
  activeGroup,
  activeSubKey,
  onNavigate,
}: CategoryChipsProps) {
  const activeSection =
    sections.find((section) => section.label === activeGroup) ?? null;

  // Un bloc sans label ne se désigne pas : c'est le corps du groupe, il n'a
  // pas de titre propre dans la grille, donc pas d'ancre à proposer.
  const subBlocks = (activeSection?.blocks ?? []).filter(
    (block) => block.label !== null,
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Scroll horizontal sur mobile (swipe naturel), retour à la ligne dès
          qu'il y a de la place : sur desktop on ne swipe pas, et une catégorie
          coupée hors écran serait tout simplement introuvable. */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {sections.map((section) => (
          <GroupChip
            key={section.id}
            label={section.label}
            count={section.count}
            isActive={activeGroup === section.label}
            onClick={() => onNavigate(section.id)}
          />
        ))}
      </div>

      {/* Sous-sections du groupe en cours de lecture. Décalée et posée sur un
          fond creux, la rangée se lit comme un contenu du groupe, pas comme un
          pair. Elle n'apparaît que s'il y a vraiment un choix à faire. */}
      {subBlocks.length > 1 && activeSection && (
        <div className="scrollbar-hide ml-3 flex items-center gap-1 overflow-x-auto rounded-xl bg-surface-2/60 px-2 py-1 sm:flex-wrap sm:overflow-visible">
          <span
            aria-hidden="true"
            className="icon-[mdi--subdirectory-arrow-right] shrink-0 text-base text-foreground/30"
          />
          {/* Renvoie au titre de la section : le point de départ du groupe. */}
          <SubChip
            label="Début"
            count={activeSection.count}
            isActive={activeSubKey === null}
            onClick={() => onNavigate(activeSection.id)}
          />
          {subBlocks.map((block) => (
            <SubChip
              key={block.key}
              label={block.label as string}
              count={block.items.length}
              isActive={activeSubKey === block.key}
              onClick={() => onNavigate(subAnchorId(block.key))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
