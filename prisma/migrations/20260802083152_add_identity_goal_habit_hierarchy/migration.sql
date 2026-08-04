-- DropForeignKey
ALTER TABLE "_HabitCheckInToTrackedHabit" DROP CONSTRAINT "_HabitCheckInToTrackedHabit_A_fkey";

-- DropForeignKey
ALTER TABLE "_HabitCheckInToTrackedHabit" DROP CONSTRAINT "_HabitCheckInToTrackedHabit_B_fkey";

-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT "goals_identityId_fkey";

-- DropForeignKey
ALTER TABLE "habit_check_ins" DROP CONSTRAINT "habit_check_ins_habitId_fkey";

-- DropForeignKey
ALTER TABLE "habits" DROP CONSTRAINT "habits_goalId_fkey";
