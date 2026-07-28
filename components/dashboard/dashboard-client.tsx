"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, type DashboardStatus, type DashboardData } from "@/lib/actions/dashboard-actions";

import { PartOneSnapshot, PartTwoSnapshot, PartThreeSnapshot, PartFourSnapshot, NextStepSnapshot } from "./types";

import OnboardingDashboard from "./onboarding-dashboard";
import BentoDashboard from "./bento-dashboard";


function statusToSnapshots(status: DashboardStatus): {
  partOne: PartOneSnapshot | null;
  partTwo: PartTwoSnapshot | null;
  partThree: PartThreeSnapshot | null;
  partFour: PartFourSnapshot | null;
  nextStep: NextStepSnapshot | null;
} {
  return {
    partOne: status.partOne?.exists
      ? { stepIndex: 0, completedAt: status.partOne.completedAt }
      : null,
    partTwo: status.partTwo?.exists
      ? {
          dayIndex: status.partTwo.dayIndex,
          completedAt: status.partTwo.completedAt,
          startDate: status.partTwo.startDate,
        }
      : null,
    partThree: status.partThree?.exists
      ? { stepIndex: 0, completedAt: status.partThree.completedAt }
      : null,
    partFour: status.partFour?.exists
      ? { completedAt: status.partFour.completedAt }
      : null,
    nextStep: status.nextStep?.exists
      ? { completedAt: status.nextStep.completedAt }
      : null,
  };
}


export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchDashboardData();
      if (cancelled) return;
      setData(result);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const snaps = data ? statusToSnapshots(data.status) : { partOne: null, partTwo: null, partThree: null, partFour: null, nextStep: null };
  const showBento = mounted && snaps.partFour?.completedAt != null;

  return (
    <div className={`flex min-h-screen flex-col transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
      {showBento && data ? (
        <BentoDashboard data={data} />
      ) : (
        <OnboardingDashboard
          partOne={snaps.partOne}
          partTwo={snaps.partTwo}
          partThree={snaps.partThree}
          partFour={snaps.partFour}
          nextStep={snaps.nextStep}
          mounted={mounted}
        />
      )}
    </div>
  );
}
