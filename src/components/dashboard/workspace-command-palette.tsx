"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceCommandAction } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

type CommandPaletteNavItem = {
  label: string;
  href: string;
};

type WorkspaceCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigation: CommandPaletteNavItem[];
  actions: WorkspaceCommandAction[];
};

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  kind: "route" | "action";
  searchIndex: string;
};

function buildPaletteItems(
  navigation: CommandPaletteNavItem[],
  actions: WorkspaceCommandAction[],
) {
  const routeItems: PaletteItem[] = navigation.map((item) => ({
    id: `route-${item.href}`,
    label: item.label,
    href: item.href,
    description: `Open ${item.label.toLowerCase()} in the current workspace.`,
    kind: "route",
    searchIndex: `${item.label} ${item.href}`.toLowerCase(),
  }));

  const actionItems: PaletteItem[] = actions.map((item) => ({
    id: `action-${item.href}`,
    label: item.label,
    href: item.href,
    description: item.description,
    kind: "action",
    searchIndex: `${item.label} ${item.href} ${item.description} ${item.keywords.join(" ")}`.toLowerCase(),
  }));

  return [...actionItems, ...routeItems];
}

export function WorkspaceCommandPalette({
  open,
  onOpenChange,
  navigation,
  actions,
}: WorkspaceCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const items = useMemo(() => buildPaletteItems(navigation, actions), [actions, navigation]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => item.searchIndex.includes(normalizedQuery));
  }, [deferredQuery, items]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  function handleSelect(item: PaletteItem) {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
    router.push(item.href);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
          setQuery("");
        }

        setActiveIndex(0);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Command palette
          </p>
          <DialogTitle>Search routes and launch key workflow actions</DialogTitle>
          <DialogDescription>
            Use Ctrl/Cmd + K to jump between modules, trigger high-frequency actions, and move
            through the finance workspace faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    Math.min(current + 1, Math.max(filteredItems.length - 1, 0)),
                  );
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }

                if (event.key === "Enter" && filteredItems[activeIndex]) {
                  event.preventDefault();
                  handleSelect(filteredItems[activeIndex]);
                }
              }}
              placeholder="Search routes, reports, uploads, invoices, and service actions"
              className="h-12 pl-11"
              autoFocus
            />
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {filteredItems.length ? (
              filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-start justify-between gap-4 rounded-[1.3rem] border px-4 py-4 text-left transition",
                    index === activeIndex
                      ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                      : "border-black/6 bg-background hover:border-primary/25 hover:bg-surface-subtle",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.kind === "action" ? "primary" : "secondary"}>
                      {item.kind === "action" ? "Action" : "Route"}
                    </Badge>
                    <span className="rounded-xl border border-black/6 bg-surface-subtle px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                      Go
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
                <p className="font-display text-2xl font-bold text-foreground">
                  No commands match
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Try searching for budgets, reports, accountant, notifications, or invoices.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
