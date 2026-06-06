export const config = {
  listName: "Set anchor to object",
  displayText: "Set anchor to object {0}",
  description: "Uses the center of the selected object as the anchor point.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "object",
      name: "Object",
      desc: "Object instance to use as the anchor source.",
      type: "object",
    },
  ],
};

export const expose = true;

export default function (object) {
  this._setAnchorToObject(object);
}
