/**
 * Shared form validation messages.
 *
 * `NOT_ENOUGH_BALANCE_ERROR` is not only shown to the user: `useTradeConditions` compares the
 * active error against it to decide whether to offer the bridge widget. Keeping it in one place
 * makes that coupling visible to the compiler instead of relying on six copies of a string literal.
 */
export const NOT_ENOUGH_BALANCE_ERROR = "Not enough balance.";
