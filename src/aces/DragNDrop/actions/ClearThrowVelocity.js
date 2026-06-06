export const config = {
  listName: "Clear throw velocity",
  displayText: "Clear throw velocity",
  description: "Removes any manual throw velocity override.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this._clearThrowVelocity();
}
