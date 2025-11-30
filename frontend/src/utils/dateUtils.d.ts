// TypeScript declarations for dateUtils.js

export interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  timeZone?: string;
}

export declare function formatFrenchDate(date: string | Date, options?: DateFormatOptions): string;
export declare function formatFrenchDateTime(date: string | Date, options?: DateFormatOptions): string;
export declare function formatFrenchTime(date: string | Date, options?: DateFormatOptions): string;
export declare function getCurrentFrenchDate(options?: DateFormatOptions): string;
export declare function getCurrentFrenchDateTime(options?: DateFormatOptions): string;
export declare function getCurrentFrenchTime(options?: DateFormatOptions): string;
export declare function getRelativeFrenchTime(date: string | Date): string;
export declare function getFrenchMonthName(monthIndex: number): string;
export declare function getFrenchDayName(dayIndex: number): string;
export declare function isToday(date: string | Date): boolean;
export declare function isOverdue(dueDate: string | Date): boolean;
export declare function getDaysUntilDue(dueDate: string | Date): number;
export declare function formatFrenchCurrency(amount: number, currency?: string): string;
export declare function getCurrentMonth(): string;
export declare function getCurrentDate(): string;
export declare function getNextMonth(): string;
export declare function getDueDate(): string;
