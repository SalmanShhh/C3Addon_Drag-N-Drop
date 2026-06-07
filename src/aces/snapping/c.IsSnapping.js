export const config = {
  listName: "Is snapping",
  displayText: "Is snapping",
  description:
    "True while the dragged object is within snap radius of a target (so a drop would snap to it).",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._isSnapping;
}
