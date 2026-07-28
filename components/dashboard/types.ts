export interface PartOneSnapshot {
  stepIndex: number;
  completedAt: string | null;
}

export interface PartTwoSnapshot {
  dayIndex: number;
  completedAt: string | null;
  startDate: string | null;
}

export interface PartThreeSnapshot {
  stepIndex: number;
  completedAt: string | null;
}

export interface PartFourSnapshot {
  completedAt: string | null;
}

export interface NextStepSnapshot {
  completedAt: string | null;
}