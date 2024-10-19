export function getNearestRoundedDownTimestamp(timestamp: number, interval: number) {
  return Math.floor(timestamp / interval) * interval;
}

export function findClosestLessThanOrEqualToTimestamp(sortedTimestamps: number[], targetTimestamp: number) {
  let left = 0;
  let right = sortedTimestamps.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedTimestamps[mid] <= targetTimestamp) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}
