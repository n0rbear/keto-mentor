import { AiProviderError, type ChatCompletionsProvider } from "./chat-completions-provider.js";
import type { AiCapability, AiProvider } from "./provider.js";

/**
 * Whether a failed primary-provider attempt is worth retrying against the
 * secondary provider. Deliberately conservative: only failures that plausibly
 * reflect the PRIMARY being transiently unavailable (rate-limited, timed out,
 * upstream 5xx, or unreachable at the network level) fail over. A response
 * the primary actually returned but that we couldn't use (invalid_response,
 * response_too_large) or a capability the primary was never asked to support
 * are not "the provider is down" — retrying a second network call for those
 * would not plausibly help and would just be an extra unexplained attempt, so
 * they propagate to the caller's own existing safe-degradation path instead.
 */
export function isRecoverableAiFailure(error: unknown): boolean {
  if (!(error instanceof AiProviderError)) return false;
  if (error.code === "timeout") return true;
  if (error.code === "http_error") {
    // No httpStatus means the request never got a response at all (network
    // failure/DNS/connection reset) — the closest thing to "provider
    // unavailable" this transport can observe.
    if (error.httpStatus === undefined) return true;
    return error.httpStatus === 429 || error.httpStatus >= 500;
  }
  return false;
}

export type FailoverStage = "primary" | "secondary";
export type FailoverOutcome = "success" | "failed_recoverable" | "failed_fatal";

export type FailoverEvent = {
  stage: FailoverStage;
  providerId: string;
  outcome: FailoverOutcome;
  errorCode?: string;
  httpStatus?: number;
};

export type FailoverObserver = (event: FailoverEvent) => void;

/**
 * Category-only production observability shared by every AI capability that
 * adopts failover — no meal text, food text, query text, user id, or
 * provider payload, only which typed stage/outcome occurred, mirroring the
 * discipline already established for quantity_ai/dynamic_food_resolution
 * logging. One shared implementation so the log format can never drift
 * between capabilities.
 */
export function createFailoverObserver(operation: string): FailoverObserver {
  return (event) => {
    console.log(
      `ai_failover operation=${operation} stage=${event.stage} provider=${event.providerId} outcome=${event.outcome}` +
      (event.errorCode ? ` providerError=${event.errorCode}` : "") +
      (event.httpStatus != null ? ` status=${event.httpStatus}` : "")
    );
  };
}

function errorInfo(error: unknown): { errorCode?: string; httpStatus?: number } {
  if (!(error instanceof AiProviderError)) return {};
  return { errorCode: error.code, httpStatus: error.httpStatus };
}

/**
 * Generic two-tier AI failover: OpenRouter (primary) -> Groq (secondary) ->
 * whatever safe fallback the caller already has (disabled provider, manual
 * grams entry, ...). Implements BOTH shapes every capability gateway already
 * consumes (`AiProvider` for food understanding, `{id, model, complete()}`
 * for quantity/search-intent/candidate-localization) so it drops straight
 * into the existing provider abstraction with no capability-specific logic
 * here at all — food-resolution and quantity code never learn Groq exists.
 *
 * Each logical AI operation makes AT MOST one attempt per provider (primary,
 * then — only on a recoverable failure — secondary once). No retry loops, no
 * repeated attempts against either provider, so a genuinely down provider can
 * never turn one user action into a retry storm.
 */
export class FailoverAiProvider implements AiProvider {
  private activeId: string;
  private activeModel: string;

  constructor(
    private readonly primary: ChatCompletionsProvider,
    private readonly secondary: ChatCompletionsProvider | undefined,
    private readonly onEvent?: FailoverObserver
  ) {
    this.activeId = primary.id;
    this.activeModel = primary.model;
  }

  // Reflects whichever provider actually served (or last attempted) the most
  // recent call, so provenance recorded by callers (e.g. quantity estimate
  // provenance.provider) stays honest after a failover instead of forever
  // claiming the primary served a result Groq actually produced.
  get id() { return this.activeId; }
  get model() { return this.activeModel; }

  supports(capability: AiCapability): boolean {
    return this.primary.supports(capability) || (this.secondary?.supports(capability) ?? false);
  }

  async run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput> {
    return this.attempt((backend) => backend.run<TInput, TOutput>(capability, input));
  }

  async complete<T>(instruction: string, input: string, validate: (value: unknown) => T): Promise<T> {
    return this.attempt((backend) => backend.complete(instruction, input, validate));
  }

  private async attempt<T>(call: (backend: ChatCompletionsProvider) => Promise<T>): Promise<T> {
    try {
      const result = await call(this.primary);
      this.activeId = this.primary.id;
      this.activeModel = this.primary.model;
      this.onEvent?.({ stage: "primary", providerId: this.primary.id, outcome: "success" });
      return result;
    } catch (error) {
      const recoverable = isRecoverableAiFailure(error);
      this.onEvent?.({ stage: "primary", providerId: this.primary.id, outcome: recoverable ? "failed_recoverable" : "failed_fatal", ...errorInfo(error) });
      if (!recoverable || !this.secondary) throw error;
      try {
        const result = await call(this.secondary);
        this.activeId = this.secondary.id;
        this.activeModel = this.secondary.model;
        this.onEvent?.({ stage: "secondary", providerId: this.secondary.id, outcome: "success" });
        return result;
      } catch (secondaryError) {
        this.activeId = this.secondary.id;
        this.activeModel = this.secondary.model;
        this.onEvent?.({ stage: "secondary", providerId: this.secondary.id, outcome: "failed_fatal", ...errorInfo(secondaryError) });
        throw secondaryError;
      }
    }
  }
}
