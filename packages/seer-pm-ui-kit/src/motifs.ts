export type ConvergenceOptions = {
  /** Number of wedges. The brand reference uses seven. */
  count?: number;
  /** Y of the first wedge's upper edge at the left side. */
  start?: number;
  /** Vertical distance between the upper edges of consecutive wedges. */
  pitch: number;
  /** Height of each wedge at the left side, where it is widest. */
  wedge: number;
  /** Point every wedge narrows to. Keep x at or past the right edge of the viewBox. */
  focus: readonly [x: number, y: number];
};

/**
 * Path data for the Electric Foundation line motif: tapered wedges that start wide on the left
 * and converge on a single point to the right. The contest brief fixes that direction, so the
 * focus sits on the right and the generator has no option to mirror it.
 */
export function convergencePaths({ count = 7, start = 0, pitch, wedge, focus }: ConvergenceOptions): string[] {
  const [x, y] = focus;
  return Array.from({ length: count }, (_, index) => {
    const top = start + index * pitch;
    return `M0 ${top} L${x} ${y} L0 ${top + wedge} Z`;
  });
}
