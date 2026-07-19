// Pure fleet keep-vs-sell modeling (Section 20). No DB. Money in cents.
//
// Weighs an asset's annual carrying cost (insurance, storage, opportunity cost
// on freed capital) against the annual brand/media value it generates, and
// returns a KEEP / REVIEW ANNUALLY / SELL CANDIDATE recommendation.

import type { FleetRecommendation } from "@/lib/enums";

export interface FleetCostInputs {
  insuranceAnnualCents?: number | null;
  storageAnnualCents?: number | null;
  opportunityCostAnnualCents?: number | null;
}

export interface FleetValueInputs {
  mediaValueAnnualCents?: number | null;
  sponsorValueAnnualCents?: number | null;
  affiliateValueAnnualCents?: number | null;
  merchValueAnnualCents?: number | null;
  eventValueAnnualCents?: number | null;
  brandValueAnnualCents?: number | null;
}

const n = (v: number | null | undefined) => v ?? 0;

export function annualCostCents(c: FleetCostInputs): number {
  return n(c.insuranceAnnualCents) + n(c.storageAnnualCents) + n(c.opportunityCostAnnualCents);
}

export function annualValueCents(v: FleetValueInputs): number {
  return (
    n(v.mediaValueAnnualCents) + n(v.sponsorValueAnnualCents) + n(v.affiliateValueAnnualCents) +
    n(v.merchValueAnnualCents) + n(v.eventValueAnnualCents) + n(v.brandValueAnnualCents)
  );
}

export interface FleetAssessmentResult {
  annualCostCents: number;
  annualValueCents: number;
  netAnnualCents: number;
  recommendation: FleetRecommendation;
  rationale: string;
}

/**
 * KEEP when the asset clearly earns its keep (value ≥ 1.5× cost). SELL CANDIDATE
 * when it's cash-flow negative. REVIEW ANNUALLY in the marginal band between.
 * With no value or cost data recorded, defaults to REVIEW ANNUALLY.
 */
export function assessFleetAsset(inputs: FleetCostInputs & FleetValueInputs): FleetAssessmentResult {
  const cost = annualCostCents(inputs);
  const value = annualValueCents(inputs);
  const net = value - cost;

  let recommendation: FleetRecommendation;
  let rationale: string;

  if (cost === 0 && value === 0) {
    recommendation = "REVIEW ANNUALLY";
    rationale = "No cost or value recorded — needs an annual review to model.";
  } else if (net < 0) {
    recommendation = "SELL CANDIDATE";
    rationale = "Annual carrying cost exceeds the value it generates.";
  } else if (value >= cost * 1.5) {
    recommendation = "KEEP";
    rationale = "Generates well above its carrying cost.";
  } else {
    recommendation = "REVIEW ANNUALLY";
    rationale = "Marginally positive — revisit annually.";
  }

  return { annualCostCents: cost, annualValueCents: value, netAnnualCents: net, recommendation, rationale };
}
