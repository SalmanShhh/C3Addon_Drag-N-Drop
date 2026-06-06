export const config = {
  listName: "Release",
  displayText: "Release the dragged object",
  description: "Ends the current drag and finalizes throw velocity.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this._releaseGrab();
}
