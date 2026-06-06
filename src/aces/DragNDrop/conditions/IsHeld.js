export const config = {
  listName: "Is held",
  displayText: "Is held",
  description: "True while the object is currently being dragged.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._held;
}
