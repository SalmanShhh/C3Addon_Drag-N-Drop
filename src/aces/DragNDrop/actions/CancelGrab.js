export const config = {
  listName: "Cancel grab",
  displayText: "Cancel the current grab",
  description: "Ends the current drag without computing throw velocity.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this._cancelGrab();
}
