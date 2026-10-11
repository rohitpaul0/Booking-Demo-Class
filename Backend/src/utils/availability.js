export const intervalOverlaps = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};