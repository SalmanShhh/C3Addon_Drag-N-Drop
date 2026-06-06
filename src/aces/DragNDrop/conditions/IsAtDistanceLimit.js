export const config = {
  listName: "Is at distance limit",
  displayText: "Is at distance limit",
  description: "True when the held object is at or beyond the clamp radius.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._distanceLimitReached;
}
