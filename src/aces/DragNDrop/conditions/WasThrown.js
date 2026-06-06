export const config = {
  listName: "Was thrown",
  displayText: "Was thrown",
  description: "True when the last release produced non-zero throw velocity.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = false;

export default function () {
  return this._wasThrown;
}
