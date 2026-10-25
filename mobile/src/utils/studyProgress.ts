export function dayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

