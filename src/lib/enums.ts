// Central catalog of enumerated values. SQLite has no native enums, so allowed
// values are validated in the app layer against these constants. Keeping them in
// one place lets the DB schema, seed data, validation, and UI stay in agreement.

export const VEHICLE_STATUSES = [
  "Potential Purchase",
  "Under Evaluation",
  "Acquired",
  "Planned Build",
  "Active Build",
  "On Hold",
  "Awaiting Parts",
  "Completed",
  "Content Asset",
  "For Sale",
  "Sold",
  "Long-Term Shop Vehicle",
  "Event Vehicle",
  "Giveaway Candidate",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const FLEET_CLASSIFICATIONS = [
  "Inventory",
  "Content Asset",
  "Shop Vehicle",
  "Show Vehicle",
  "Event Vehicle",
  "Giveaway Candidate",
] as const;
export type FleetClassification = (typeof FLEET_CLASSIFICATIONS)[number];

export const PROJECT_STATUSES = [
  "Planned",
  "Active",
  "On Hold",
  "Behind Schedule",
  "Over Budget",
  "Completed",
  "Cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Ordered standard build phases (Section 11).
export const BUILD_PHASE_NAMES = [
  "Acquisition",
  "Inspection",
  "Teardown",
  "Chassis",
  "Suspension",
  "Lowering / Lifting",
  "Fabrication",
  "Drivetrain",
  "Brakes",
  "Wheels / Tires",
  "Electrical",
  "Body",
  "Paint",
  "Patina",
  "Interior",
  "Final Assembly",
  "Testing",
  "Alignment",
  "Road Test",
  "Reveal",
  "Sale",
] as const;
export type BuildPhaseName = (typeof BUILD_PHASE_NAMES)[number];

export const PHASE_STATUSES = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Complete",
] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const TASK_STATUSES = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Waiting on Parts",
  "In Review",
  "Complete",
  "Cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Event type spans operational, financial, and content timing.
export const EVENT_TYPES = [
  "work",
  "cash_outflow",
  "cash_inflow",
  "content",
  "revenue",
  "milestone",
  "camera",
  "editing",
  "social",
  "sponsor_deliverable",
  "vehicle_sale",
  "giveaway",
  "event",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = [
  "Tentative",
  "Scheduled",
  "In Progress",
  "Complete",
  "Cancelled",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const DEPENDENCY_TYPES = [
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

// Risk taxonomy (Section 6).
export const RISK_CATEGORIES = [
  "Parts Delay",
  "Vendor Delay",
  "Partner Shop Delay",
  "Labor Shortage",
  "Capacity Overload",
  "Camera Conflict",
  "Editing Delay",
  "Sponsor Approval Delay",
  "Social Delay",
  "Cash Shortage",
  "Cost Overrun",
  "Vehicle Sale Delay",
  "Giveaway Legal Hold",
  "Merch Inventory Issue",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_RESPONSES = [
  "Accept Delay",
  "Expedite Shipping",
  "Change Vendor",
  "Alternate Part",
  "Add Labor",
  "Shift Shop Priority",
  "Move Camera",
  "Publish Alternate Content",
  "Delay Purchase",
  "Delay Another Project",
  "Protect Sale Date",
] as const;
export type RiskResponse = (typeof RISK_RESPONSES)[number];

export const RISK_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const RISK_LIKELIHOODS = ["low", "medium", "high"] as const;
export const RISK_STATUSES = ["open", "mitigating", "accepted", "resolved"] as const;

export const NOTIFICATION_TYPES = [
  "task_due",
  "dependency_risk",
  "schedule_change",
  "cash_due",
  "payment_overdue",
  "sponsor_deliverable",
  "sponsor_approval",
  "customer_approval",
  "camera_conflict",
  "editing_conflict",
  "merch_launch",
  "giveaway_compliance_hold",
  "low_inventory",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
