"use client";

import { BrainCircuit, Check, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCategorizationSourceLabel,
  formatConfidenceLabel,
  formatTransactionAmount,
  formatTransactionDate,
  getConfidenceVariant,
  isTransactionInCategorizationQueue,
} from "@/features/transactions/transaction-utils";
import type {
  CategorizationSuggestion,
  TransactionRecord,
  TransactionRuleRecord,
  TransactionSummary,
} from "@/types/finance";

type ApplyResponse = {
  ok?: boolean;
  message?: string;
  transactions?: TransactionRecord[];
  summary?: TransactionSummary;
  rules?: TransactionRuleRecord[];
};

type CategorizationReviewPanelProps = {
  transactions: TransactionRecord[];
  rules: TransactionRuleRecord[];
  queueCount: number;
  onApplyComplete: (payload: {
    transactions: TransactionRecord[];
    summary: TransactionSummary;
    rules: TransactionRuleRecord[];
  }) => void;
};

export function CategorizationReviewPanel({
  transactions,
  rules,
  queueCount,
  onApplyComplete,
}: CategorizationReviewPanelProps) {
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saveRuleById, setSaveRuleById] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const queueTransactions = useMemo(
    () => transactions.filter(isTransactionInCategorizationQueue),
    [transactions],
  );

  useEffect(() => {
    const queueTransactionIds = new Set(queueTransactions.map((transaction) => transaction.id));

    setSuggestions((current) =>
      current.filter((suggestion) => queueTransactionIds.has(suggestion.transactionId)),
    );
    setSelectedIds((current) => current.filter((id) => queueTransactionIds.has(id)));
    setSaveRuleById((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([transactionId]) => queueTransactionIds.has(transactionId)),
      ),
    );
  }, [queueTransactions]);

  async function handleGenerateSuggestions() {
    if (!queueTransactions.length) {
      toast.message("Everything already has a category. Add or clear a transaction to test AI review.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest",
          transactionIds: queueTransactions.map((transaction) => transaction.id),
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        suggestions?: CategorizationSuggestion[];
      };

      if (!response.ok || !payload.suggestions) {
        throw new Error(payload.message ?? "Unable to generate categorization suggestions.");
      }

      setSuggestions(payload.suggestions);
      setSelectedIds(payload.suggestions.map((suggestion) => suggestion.transactionId));
      setSaveRuleById(
        Object.fromEntries(
          payload.suggestions.map((suggestion) => [
            suggestion.transactionId,
            Boolean(
              suggestion.ruleMatchField &&
                suggestion.ruleMatchValue &&
                suggestion.source !== "rule",
            ),
          ]),
        ),
      );
      toast.success("AI review queue refreshed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate suggestions.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function applySuggestions(transactionIds: string[]) {
    const selectedSuggestions = suggestions.filter((suggestion) =>
      transactionIds.includes(suggestion.transactionId),
    );

    if (!selectedSuggestions.length) {
      toast.message("Select at least one suggestion to apply.");
      return;
    }

    setIsApplying(true);

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          suggestions: selectedSuggestions.map((suggestion) => ({
            transactionId: suggestion.transactionId,
            suggestedCategoryId: suggestion.suggestedCategoryId,
            confidence: suggestion.confidence,
            reason: suggestion.reason,
            saveRule: Boolean(saveRuleById[suggestion.transactionId]),
            ruleMatchField: suggestion.ruleMatchField,
            ruleMatchValue: suggestion.ruleMatchValue,
          })),
        }),
      });
      const payload = (await response.json()) as ApplyResponse;

      if (!response.ok || !payload.transactions || !payload.summary || !payload.rules) {
        throw new Error(payload.message ?? "Unable to apply categorization updates.");
      }

      onApplyComplete({
        transactions: payload.transactions,
        summary: payload.summary,
        rules: payload.rules,
      });
      setSuggestions((current) =>
        current.filter((suggestion) => !transactionIds.includes(suggestion.transactionId)),
      );
      setSelectedIds((current) => current.filter((id) => !transactionIds.includes(id)));
      setSaveRuleById((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([transactionId]) => !transactionIds.includes(transactionId)),
        ),
      );
      toast.success("AI categorization applied to the ledger.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to apply suggestions.";
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  }

  function toggleSelected(transactionId: string) {
    setSelectedIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId],
    );
  }

  function dismissSuggestion(transactionId: string) {
    setSuggestions((current) =>
      current.filter((suggestion) => suggestion.transactionId !== transactionId),
    );
    setSelectedIds((current) => current.filter((id) => id !== transactionId));
  }

  return (
    <Card className="rounded-[1.8rem] border-primary/10">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Day 16 AI review</p>
          <CardTitle className="mt-3">Categorization queue</CardTitle>
          <CardDescription>
            Review uncategorized transactions, accept AI suggestions, and save stable patterns as reusable rules.
          </CardDescription>
        </div>
        <div className="rounded-2xl bg-primary/8 p-3 text-primary">
          <BrainCircuit className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {queueCount} transaction{queueCount === 1 ? "" : "s"} waiting for categorization
            </p>
            <p className="mt-1 text-sm leading-7 text-muted">
              {rules.length} saved rule{rules.length === 1 ? "" : "s"} already support automatic categorization.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleGenerateSuggestions} disabled={isGenerating}>
              <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generating..." : "Generate suggestions"}
            </Button>
            <Button
              onClick={() => applySuggestions(selectedIds)}
              disabled={!selectedIds.length || isApplying}
            >
              <Sparkles className="h-4 w-4" />
              {isApplying ? "Applying..." : `Apply selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>

        {!suggestions.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {queueTransactions.length ? (
              queueTransactions.slice(0, 4).map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-[1.3rem] border border-dashed border-black/8 bg-surface-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{transaction.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {transaction.merchantName || "Merchant pending"} · {formatTransactionDate(transaction.transactionDate)}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {formatTransactionAmount(transaction.amount, transaction.currency)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-medium text-foreground">Queue is clear</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  New uncategorized income and expense records will appear here for AI review.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.transactionId}
                className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getConfidenceVariant(suggestion.confidence)}>
                        {formatConfidenceLabel(suggestion.confidence)}
                      </Badge>
                      <Badge variant={suggestion.source === "openai" ? "primary" : "secondary"}>
                        {formatCategorizationSourceLabel(suggestion.source)}
                      </Badge>
                      <Badge variant="neutral">{suggestion.suggestedCategoryLabel}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{suggestion.transactionTitle}</p>
                      <p className="mt-1 text-sm text-muted">
                        {suggestion.merchantName || "Merchant pending"}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-muted">{suggestion.reason}</p>
                    {suggestion.ruleMatchField && suggestion.ruleMatchValue ? (
                      <label className="flex items-center gap-3 text-sm text-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-border accent-[var(--color-primary)]"
                          checked={Boolean(saveRuleById[suggestion.transactionId])}
                          onChange={() =>
                            setSaveRuleById((current) => ({
                              ...current,
                              [suggestion.transactionId]: !current[suggestion.transactionId],
                            }))
                          }
                        />
                        Save rule from {suggestion.ruleMatchField}: {suggestion.ruleMatchValue}
                      </label>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-black/6 bg-surface px-4 py-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-border accent-[var(--color-primary)]"
                        checked={selectedIds.includes(suggestion.transactionId)}
                        onChange={() => toggleSelected(suggestion.transactionId)}
                      />
                      Include
                    </label>
                    <Button
                      variant="secondary"
                      onClick={() => applySuggestions([suggestion.transactionId])}
                      disabled={isApplying}
                    >
                      <Check className="h-4 w-4" />
                      Apply now
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => dismissSuggestion(suggestion.transactionId)}
                    >
                      <X className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
