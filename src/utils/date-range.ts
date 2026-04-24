import { StatsPeriod } from "../modules/dashboard/dto/dashboard.dto.js";

export const getDateRange = (
  period: StatsPeriod,
  year?: string,
  month?: string,
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const selectedYear = year ? parseInt(year) : now.getFullYear();
  const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();

  if (period === StatsPeriod.YEAR) {
    return {
      startDate: new Date(selectedYear, 0, 1),
      endDate: new Date(selectedYear, 11, 31, 23, 59, 59),
    };
  }

  if (period === StatsPeriod.MONTH) {
    return {
      startDate: new Date(selectedYear, selectedMonth, 1),
      endDate: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59),
    };
  }

  // DAY — last 30 days
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29),
    endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
  };
};