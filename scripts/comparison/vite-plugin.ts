/** Isolate comparison instrumentation from production code and build output. */
export function comparisonBridge() {
  return {
    name: "seer-review-comparison",
    transform(code: string, id: string) {
      if (process.env.VITE_DESIGN_PREVIEW === "true" && /\/components\/Layout\/LayoutShell\.tsx$/.test(id)) {
        return { code: `${code}\nimport "./comparison-bridge";`, map: null };
      }
    },
  };
}
