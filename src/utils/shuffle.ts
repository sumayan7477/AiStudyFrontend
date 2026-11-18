/** [0, 1, ..., count - 1]. */
export function identityOrder(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
}

/**
 * Returns a shuffled copy (Fisher-Yates): every item appears exactly once, none lost or duplicated.
 * `random` is injectable for tests.
 */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
