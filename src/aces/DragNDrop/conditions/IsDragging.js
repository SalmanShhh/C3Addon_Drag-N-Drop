export const config = {
  listName: "Is dragging",
  displayText: "Is dragging",
  description: "True while the object is being dragged.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._dragging;
}
