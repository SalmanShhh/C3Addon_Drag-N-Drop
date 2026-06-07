export const config = {
  listName: "Add snap object",
  displayText: "Add snap object {0}",
  description:
    "Registers an object as a snap and magnet target by its position. Use a For each loop to add many. Needs a snap radius to take effect.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "object",
      name: "Object",
      desc: "The object instance whose position becomes a snap target.",
      type: "object",
    },
  ],
};

export const expose = true;

export default function (object) {
  this._addSnapObject(object);
}
