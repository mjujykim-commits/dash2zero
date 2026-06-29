/**
 * Privacy Evaluator — dash2zero harness (ADR-0003)
 *
 * 분류:
 *   - age_gate (< 13 차단)
 *   - idfa (App Tracking Transparency 거부 시 ad_id 미수집)
 *   - privacy_choices (analytics/personalization/marketing 독립 토글)
 *   - dsr_delete (30일 SLA + immediate signOut + cron-hard-delete)
 *   - dsr_export (CC-11 data export)
 *   - soft_delete (profiles.soft_deleted_at 즉시 차단, RLS deny)
 *
 * 정합성: 정책 표는 docs/legal/PRIVACY_POLICY.md + CC-04/-11 + CC2-11 + CC3-04
 * 책임 agent: legal + security + analytics
 */

export interface PrivacyCase {
  id: string;
  description: string;
  category:
    | "age_gate"
    | "idfa"
    | "privacy_choices"
    | "dsr_delete"
    | "dsr_export"
    | "soft_delete";
  input: {
    // age_gate
    age?: number;
    // idfa
    att_status?: "authorized" | "denied" | "not_determined" | "restricted";
    requested_ad_id?: boolean;
    // privacy_choices
    choice?: {
      analytics?: boolean;
      personalization?: boolean;
      marketing?: boolean;
    };
    requested_event_send?: "analytics" | "personalization" | "marketing";
    // dsr_delete / soft_delete
    delete_request_at?: string;  // ISO
    now?: string;                // ISO
    // dsr_export
    export_request_at?: string;
  };
  expected: {
    allowed?: boolean;
    ad_id_collected?: boolean;
    event_sent?: boolean;
    soft_deleted_at?: string;
    scheduled_hard_delete_at?: string;
    hard_delete_eligible?: boolean;
    export_sla_days?: number;
    immediate_signout?: boolean;
  };
}

export interface EvalResult {
  pass: boolean;
  diff: string[];
}

function check(field: string, actual: unknown, expected: unknown, diff: string[]): void {
  if (expected === undefined) return;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    diff.push(`${field}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

const MIN_AGE = 13;                // CC-04 KOPPA / GDPR-K
const DELETE_SLA_DAYS = 30;        // CC-11
const EXPORT_SLA_DAYS = 30;        // CC-11

export function evaluatePrivacyCase(c: PrivacyCase): EvalResult {
  const diff: string[] = [];
  const i = c.input;

  switch (c.category) {
    case "age_gate": {
      const allowed = (i.age ?? 0) >= MIN_AGE;
      check("allowed", allowed, c.expected.allowed, diff);
      break;
    }

    case "idfa": {
      const adIdCollected = i.requested_ad_id === true && i.att_status === "authorized";
      check("ad_id_collected", adIdCollected, c.expected.ad_id_collected, diff);
      break;
    }

    case "privacy_choices": {
      const target = i.requested_event_send;
      const allow = target ? Boolean(i.choice?.[target]) : false;
      check("event_sent", allow, c.expected.event_sent, diff);
      break;
    }

    case "dsr_delete":
    case "soft_delete": {
      if (!i.delete_request_at) {
        diff.push("delete_request_at required");
        break;
      }
      const req = new Date(i.delete_request_at);
      const expectedHardDelete = new Date(req);
      expectedHardDelete.setUTCDate(expectedHardDelete.getUTCDate() + DELETE_SLA_DAYS);

      // W15-10b fix (2026-05-18): strip milliseconds for fixture compatibility (.000Z → Z)
      const isoNoMs = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
      check("soft_deleted_at", isoNoMs(req), c.expected.soft_deleted_at, diff);
      check(
        "scheduled_hard_delete_at",
        isoNoMs(expectedHardDelete),
        c.expected.scheduled_hard_delete_at,
        diff
      );
      check("immediate_signout", true, c.expected.immediate_signout, diff);

      if (c.expected.hard_delete_eligible !== undefined && i.now) {
        const eligible = new Date(i.now) >= expectedHardDelete;
        check("hard_delete_eligible", eligible, c.expected.hard_delete_eligible, diff);
      }
      break;
    }

    case "dsr_export": {
      check("export_sla_days", EXPORT_SLA_DAYS, c.expected.export_sla_days, diff);
      break;
    }
  }

  return { pass: diff.length === 0, diff };
}
