export function dayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Local-midnight Date for a "YYYY-MM-DD" key. Never use new Date("YYYY-MM-DD"): that parses as UTC
// and lands on the previous day west of Greenwich.
export function parseDayKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Calendar arithmetic on local dates (handles month/year rollover and DST)
export function addDays(key: string, amount: number): string {
    const date = parseDayKey(key);
    date.setDate(date.getDate() + amount);
    return dayKey(date);
}

// Monday of the week containing the given day
export function weekStart(key: string): string {
    const date = parseDayKey(key);
    date.setDate(date.getDate() - (date.getDay() + 6) % 7);
    return dayKey(date);
}

export function weeklyMilliseconds(days: Record<string, number>, now = new Date()): number {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    let total = 0;
    for (let offset = 0; offset < 7; offset++) {
        total += days[dayKey(monday)] || 0;
        monday.setDate(monday.getDate() + 1);
    }
    return total;
}

