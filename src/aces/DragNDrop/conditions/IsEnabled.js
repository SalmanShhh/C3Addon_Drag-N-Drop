export const config = {
  listName: "Is enabled",
  displayText: "Is enabled",
  description: "True if the behaviour is active.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._enabled;
}
