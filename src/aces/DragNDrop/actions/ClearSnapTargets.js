export const config = {
  listName: "Clear snap targets",
  displayText: "Clear snap targets",
  description: "Removes all registered snap positions and snap objects.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this._clearSnapTargets();
}
