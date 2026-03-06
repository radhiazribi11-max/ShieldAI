let blockedCount = 0;
export function logSecurity(original, cleaned) {
    if (original !== cleaned) {
        blockedCount++;
    }
    return { blocked: blockedCount };
}

