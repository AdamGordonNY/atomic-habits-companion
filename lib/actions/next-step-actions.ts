"use server";

export {
  fetchNextStep,
  fetchGoalEntryById,
  upsertNextStep,
  type NextStepGoalData,
  type NextStepData,
  type GoalEntryData,
} from "./assessment-next-step-actions";

export {
  actionGetAssignableGoalsForIdentity,
  actionGetAttachableIdentitiesForGoal,
  actionAttachGoalToIdentity,
  actionUpdateGoalCategory,
  actionUpdateIdentityCategory,
  type GoalAssignmentOption,
  type IdentityAssignmentOption,
} from "./identity-goal-actions";
