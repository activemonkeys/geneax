import type { ParsedDate } from '@/types/index';

export function parseDate(dateInput: any): ParsedDate {
    if (!dateInput) {
        return { year: 1800, precision: 'unknown' };
    }

    let dateString: string | undefined;

    if (typeof dateInput === 'string') {
        dateString = dateInput;
    } else if (typeof dateInput === 'object') {
        if (dateInput['#text']) {
            dateString = dateInput['#text'];
        } else if (dateInput.From || dateInput['a2a:From']) {
            dateString = dateInput.From || dateInput['a2a:From'];
        } else if (dateInput.Date) {
            const dateField = dateInput.Date;
            dateString = dateField['#text'] || dateField;
        } else if (dateInput['a2a:Date']) {
            dateString = dateInput['a2a:Date'];
        } else if (dateInput.Year || dateInput['a2a:Year']) {
            const year = dateInput.Year || dateInput['a2a:Year'];
            const month = dateInput.Month || dateInput['a2a:Month'];
            const day = dateInput.Day || dateInput['a2a:Day'];

            return {
                year: typeof year === 'number' ? year : parseInt(year, 10),
                month: month ? (typeof month === 'number' ? month : parseInt(month, 10)) : undefined,
                day: day ? (typeof day === 'number' ? day : parseInt(day, 10)) : undefined,
                precision: day ? 'day' : month ? 'month' : 'year',
            };
        }
    }

    if (!dateString) {
        return { year: 1800, precision: 'unknown' };
    }

    if (dateString.toLowerCase().includes('circa') || dateString.toLowerCase().includes('ca.')) {
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch) {
            return {
                year: parseInt(yearMatch[1], 10),
                precision: 'circa',
                original: dateString,
            };
        }
    }

    if (dateString.includes('-') && dateString.split('-').length === 2 && dateString.match(/^\d{4}-\d{4}$/)) {
        const [startYear] = dateString.split('-');
        return {
            year: parseInt(startYear, 10),
            precision: 'range',
            original: dateString,
        };
    }

    const fullDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (fullDateMatch) {
        return {
            year: parseInt(fullDateMatch[1], 10),
            month: parseInt(fullDateMatch[2], 10),
            day: parseInt(fullDateMatch[3], 10),
            precision: 'day',
            original: dateString,
        };
    }

    const yearMonthMatch = dateString.match(/^(\d{4})-(\d{2})$/);
    if (yearMonthMatch) {
        return {
            year: parseInt(yearMonthMatch[1], 10),
            month: parseInt(yearMonthMatch[2], 10),
            precision: 'month',
            original: dateString,
        };
    }

    const yearMatch = dateString.match(/(\d{4})/);
    if (yearMatch) {
        return {
            year: parseInt(yearMatch[1], 10),
            precision: 'year',
            original: dateString,
        };
    }

    return { year: 1800, precision: 'unknown', original: dateString };
}

export function formatDateForDisplay(date: ParsedDate): string {
    if (date.precision === 'unknown') return 'Unknown';
    if (date.precision === 'circa') return `ca. ${date.year}`;
    if (date.precision === 'range') return date.original || `${date.year}`;
    if (date.precision === 'year') return `${date.year}`;
    if (date.precision === 'month') return `${date.year}-${String(date.month).padStart(2, '0')}`;
    if (date.precision === 'day') {
        return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }
    return date.original || 'Unknown';
}