import * as React from 'react';

declare module 'react-date-range' {
  export interface Range {
    startDate?: Date;
    endDate?: Date;
    key?: string;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange: (ranges: any) => void;
    months?: number;
    direction?: 'horizontal' | 'vertical';
    showDateDisplay?: boolean;
    showMonthAndYearPickers?: boolean;
    rangeColors?: string[];
    locale?: any;
    minDate?: Date;
    maxDate?: Date;
    dateDisplayFormat?: string;
    editableDateInputs?: boolean;
    moveRangeOnFirstSelection?: boolean;
  }

  export class DateRange extends React.Component<DateRangeProps> {}

  export function createStaticRanges(ranges: any[]): any[];
  export const defaultStaticRanges: any[];
  export const defaultInputRanges: any[];
}
