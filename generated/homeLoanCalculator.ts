/**
 * Represents the result of a home loan calculation.
 */
export interface LoanCalculationResult {
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationEntry[];
}

/**
 * Represents a single entry in the amortization schedule.
 */
export interface AmortizationEntry {
  month: number;
  startingBalance: number;
  monthlyPayment: number;
  interestPaid: number;
  principalPaid: number;
  endingBalance: number;
}

/**
 * A utility class for calculating home loan details.
 */
export class HomeLoanCalculator {

  /**
   * Calculates the monthly payment for a home loan.
   * @param principal The total amount of the loan.
   * @param annualInterestRate The annual interest rate (e.g., 0.05 for 5%).
   * @param loanTermYears The loan term in years.
   * @returns The monthly payment amount.
   * @throws Error if inputs are invalid.
   */
  public static calculateMonthlyPayment(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): number {
    if (principal <= 0 || annualInterestRate < 0 || loanTermYears <= 0) {
      throw new Error("Invalid input: Principal, annual interest rate, and loan term must be positive numbers. Interest rate cannot be negative.");
    }

    const monthlyInterestRate = annualInterestRate / 12;
    const numberOfPayments = loanTermYears * 12;

    if (monthlyInterestRate === 0) {
      return principal / numberOfPayments;
    }

    const numerator = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;

    return numerator / denominator;
  }

  /**
   * Calculates the total repayment amount for a home loan.
   * @param principal The total amount of the loan.
   * @param annualInterestRate The annual interest rate (e.g., 0.05 for 5%).
   * @param loanTermYears The loan term in years.
   * @returns The total repayment amount.
   * @throws Error if inputs are invalid.
   */
  public static calculateTotalRepayment(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): number {
    const monthlyPayment = HomeLoanCalculator.calculateMonthlyPayment(principal, annualInterestRate, loanTermYears);
    const numberOfPayments = loanTermYears * 12;
    return monthlyPayment * numberOfPayments;
  }

  /**
   * Calculates the total interest paid over the life of the loan.
   * @param principal The total amount of the loan.
   * @param annualInterestRate The annual interest rate (e.g., 0.05 for 5%).
   * @param loanTermYears The loan term in years.
   * @returns The total interest paid.
   * @throws Error if inputs are invalid.
   */
  public static calculateTotalInterest(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): number {
    const totalRepayment = HomeLoanCalculator.calculateTotalRepayment(principal, annualInterestRate, loanTermYears);
    return totalRepayment - principal;
  }

  /**
   * Generates an amortization schedule for a home loan.
   * @param principal The total amount of the loan.
   * @param annualInterestRate The annual interest rate (e.g., 0.05 for 5%).
   * @param loanTermYears The loan term in years.
   * @returns An array of AmortizationEntry objects.
   * @throws Error if inputs are invalid.
   */
  public static generateAmortizationSchedule(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): AmortizationEntry[] {
    const monthlyPayment = HomeLoanCalculator.calculateMonthlyPayment(principal, annualInterestRate, loanTermYears);
    const monthlyInterestRate = annualInterestRate / 12;
    const numberOfPayments = loanTermYears * 12;

    let currentBalance = principal;
    const schedule: AmortizationEntry[] = [];

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPaidThisMonth = currentBalance * monthlyInterestRate;
      let principalPaidThisMonth = monthlyPayment - interestPaidThisMonth;

      // Adjust last payment to account for potential rounding errors
      if (month === numberOfPayments) {
        principalPaidThisMonth = currentBalance; // Ensure balance goes to zero
        // Recalculate monthlyPayment for the last month to ensure it matches
        // the remaining balance + interest. This is a common adjustment.
        // For simplicity, we'll let the last principalPaidThisMonth clear the balance.
        // The monthlyPayment for the last month might slightly differ if we strictly
        // force endingBalance to 0.
      }

      const endingBalance = currentBalance - principalPaidThisMonth;

      schedule.push({
        month: month,
        startingBalance: parseFloat(currentBalance.toFixed(2)),
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        interestPaid: parseFloat(interestPaidThisMonth.toFixed(2)),
        principalPaid: parseFloat(principalPaidThisMonth.toFixed(2)),
        endingBalance: parseFloat(Math.max(0, endingBalance).toFixed(2)) // Ensure ending balance doesn't go negative due to rounding
      });

      currentBalance = endingBalance;
    }

    // Final adjustment for the very last payment to ensure ending balance is exactly 0
    // This is a common practice to handle floating point inaccuracies.
    if (schedule.length > 0) {
        const lastEntry = schedule[schedule.length - 1];
        if (lastEntry.endingBalance !== 0) {
            const diff = lastEntry.endingBalance;
            lastEntry.principalPaid = parseFloat((lastEntry.principalPaid + diff).toFixed(2));
            lastEntry.monthlyPayment = parseFloat((lastEntry.monthlyPayment + diff).toFixed(2));
            lastEntry.endingBalance = 0;
        }
    }

    return schedule;
  }

  /**
   * Calculates all home loan details and returns them in a single result object.
   * @param principal The total amount of the loan.
   * @param annualInterestRate The annual interest rate (e.g., 0.05 for 5%).
   * @param loanTermYears The loan term in years.
   * @returns A LoanCalculationResult object.
   * @throws Error if inputs are invalid.
   */
  public static calculateLoanDetails(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): LoanCalculationResult {
    const monthlyPayment = HomeLoanCalculator.calculateMonthlyPayment(principal, annualInterestRate, loanTermYears);
    const totalRepayment = HomeLoanCalculator.calculateTotalRepayment(principal, annualInterestRate, loanTermYears);
    const totalInterest = HomeLoanCalculator.calculateTotalInterest(principal, annualInterestRate, loanTermYears);
    const amortizationSchedule = HomeLoanCalculator.generateAmortizationSchedule(principal, annualInterestRate, loanTermYears);

    return {
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      totalRepayment: parseFloat(totalRepayment.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      amortizationSchedule: amortizationSchedule
    };
  }
}