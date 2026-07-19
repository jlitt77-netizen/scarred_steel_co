import { z } from "zod";
import {
  VEHICLE_STATUSES,
  FLEET_CLASSIFICATIONS,
  PROJECT_STATUSES,
  BUILD_PHASE_NAMES,
  PHASE_STATUSES,
  TASK_STATUSES,
  EVENT_TYPES,
  EVENT_STATUSES,
  DEPENDENCY_TYPES,
  RISK_CATEGORIES,
  RISK_RESPONSES,
  RISK_SEVERITIES,
  RISK_LIKELIHOODS,
  RISK_STATUSES,
  COST_CATEGORIES,
  COST_STATUSES,
  PARTS_STATUSES,
  DOCUMENT_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
} from "./enums";

const cents = z.number().int("Money must be whole cents").safe();
const optionalCents = cents.nullish();
const optionalDate = z.coerce.date().nullish();

export const vehicleCreateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  trim: z.string().max(60).nullish(),
  nickname: z.string().max(80).nullish(),
  vin: z.string().max(32).nullish(),
  status: z.enum(VEHICLE_STATUSES).default("Potential Purchase"),
  classification: z.enum(FLEET_CLASSIFICATIONS).nullish(),
  acquisitionCostCents: optionalCents,
  buildBudgetCents: optionalCents,
  revisedBudgetCents: optionalCents,
  actualCostCents: optionalCents,
  sponsorProductOffsetsCents: optionalCents,
  sponsorCashCents: optionalCents,
  currentMarketValueCents: optionalCents,
  targetSalePriceCents: optionalCents,
  requiredSalePriceCents: optionalCents,
  actualSalePriceCents: optionalCents,
  acquiredAt: optionalDate,
  soldAt: optionalDate,
});
export const vehicleUpdateSchema = vehicleCreateSchema.partial();
export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;

export const projectCreateSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullish(),
  status: z.enum(PROJECT_STATUSES).default("Planned"),
  budgetCents: optionalCents,
  actualCostCents: optionalCents,
  percentComplete: z.number().int().min(0).max(100).default(0),
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
  actualStart: optionalDate,
  actualEnd: optionalDate,
});
export const projectUpdateSchema = projectCreateSchema.partial().omit({ vehicleId: true });
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const phaseCreateSchema = z.object({
  projectId: z.string().min(1),
  name: z.enum(BUILD_PHASE_NAMES),
  sequence: z.number().int().min(0).default(0),
  status: z.enum(PHASE_STATUSES).default("Not Started"),
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
  actualStart: optionalDate,
  actualEnd: optionalDate,
  percentComplete: z.number().int().min(0).max(100).default(0),
});
export type PhaseCreateInput = z.infer<typeof phaseCreateSchema>;

export const taskCreateSchema = z.object({
  projectId: z.string().min(1),
  phaseId: z.string().min(1).nullish(),
  parentTaskId: z.string().min(1).nullish(),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullish(),
  status: z.enum(TASK_STATUSES).default("Not Started"),
  ownerId: z.string().min(1).nullish(),
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
  actualStart: optionalDate,
  actualEnd: optionalDate,
  estimatedHours: z.number().min(0).nullish(),
  actualHours: z.number().min(0).nullish(),
  budgetCents: optionalCents,
  actualCostCents: optionalCents,
  percentComplete: z.number().int().min(0).max(100).default(0),
});
export const taskUpdateSchema = taskCreateSchema.partial().omit({ projectId: true });
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// The four independent dates are each optional and never coupled.
export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(160),
    type: z.enum(EVENT_TYPES).default("work"),
    description: z.string().max(2000).nullish(),
    status: z.enum(EVENT_STATUSES).default("Scheduled"),
    vehicleId: z.string().min(1).nullish(),
    projectId: z.string().min(1).nullish(),
    taskId: z.string().min(1).nullish(),
    workDate: optionalDate,
    cashDate: optionalDate,
    contentDate: optionalDate,
    revenueDate: optionalDate,
    amountCents: optionalCents,
  })
  .refine(
    (e) => e.workDate || e.cashDate || e.contentDate || e.revenueDate,
    { message: "An event must have at least one of work/cash/content/revenue date." },
  );
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const dependencyCreateSchema = z
  .object({
    predecessorId: z.string().min(1),
    successorId: z.string().min(1),
    type: z.enum(DEPENDENCY_TYPES).default("finish_to_start"),
    lagDays: z.number().int().default(0),
  })
  .refine((d) => d.predecessorId !== d.successorId, {
    message: "A task cannot depend on itself.",
  });
export type DependencyCreateInput = z.infer<typeof dependencyCreateSchema>;

export const riskCreateSchema = z.object({
  category: z.enum(RISK_CATEGORIES),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullish(),
  severity: z.enum(RISK_SEVERITIES).default("medium"),
  likelihood: z.enum(RISK_LIKELIHOODS).default("medium"),
  status: z.enum(RISK_STATUSES).default("open"),
  responseOption: z.enum(RISK_RESPONSES).nullish(),
  scheduleImpactDays: z.coerce.number().int().nullish(),
  costImpactCents: optionalCents,
  revenueImpactCents: optionalCents,
  cashImpactCents: optionalCents,
  projectId: z.string().min(1).nullish(),
  vehicleId: z.string().min(1).nullish(),
  ownerId: z.string().min(1).nullish(),
  dueDate: optionalDate,
});
export type RiskCreateInput = z.infer<typeof riskCreateSchema>;

// ---- Phase 3: Build OS ------------------------------------------------------
export const costItemCreateSchema = z.object({
  projectId: z.string().min(1),
  phaseId: z.string().min(1).nullish(),
  category: z.enum(COST_CATEGORIES),
  description: z.string().min(1).max(200),
  vendor: z.string().max(120).nullish(),
  status: z.enum(COST_STATUSES).default("planned"),
  budgetCents: optionalCents,
  committedCents: optionalCents,
  actualCents: optionalCents,
  scheduledCashDate: optionalDate,
  paidDate: optionalDate,
  notes: z.string().max(1000).nullish(),
});
export type CostItemCreateInput = z.infer<typeof costItemCreateSchema>;

export const partsOrderCreateSchema = z.object({
  projectId: z.string().min(1),
  phaseId: z.string().min(1).nullish(),
  manufacturer: z.string().max(120).nullish(),
  partName: z.string().min(1).max(160),
  partNumber: z.string().max(80).nullish(),
  quantity: z.number().int().min(1).default(1),
  unitCostCents: optionalCents,
  status: z.enum(PARTS_STATUSES).default("needed"),
  vendor: z.string().max(120).nullish(),
  affiliateUrl: z.string().url().max(500).nullish().or(z.literal("")),
  orderedAt: optionalDate,
  expectedAt: optionalDate,
  receivedAt: optionalDate,
  notes: z.string().max(1000).nullish(),
});
export type PartsOrderCreateInput = z.infer<typeof partsOrderCreateSchema>;

export const documentCreateSchema = z.object({
  vehicleId: z.string().min(1).nullish(),
  projectId: z.string().min(1).nullish(),
  name: z.string().min(1).max(160),
  category: z.enum(DOCUMENT_CATEGORIES).default("Other"),
  url: z.string().url().max(1000).nullish().or(z.literal("")),
  notes: z.string().max(1000).nullish(),
});
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;

export const photoCreateSchema = z.object({
  vehicleId: z.string().min(1).nullish(),
  projectId: z.string().min(1).nullish(),
  phaseId: z.string().min(1).nullish(),
  url: z.string().url().max(1000),
  caption: z.string().max(200).nullish(),
});
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

export const issueCreateSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  severity: z.enum(ISSUE_SEVERITIES).default("medium"),
  status: z.enum(ISSUE_STATUSES).default("open"),
});
export type IssueCreateInput = z.infer<typeof issueCreateSchema>;

export const settingUpsertSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().max(4000),
  category: z.string().max(40).default("general"),
  description: z.string().max(400).nullish(),
});
