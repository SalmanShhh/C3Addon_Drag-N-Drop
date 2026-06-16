export const config = {
  listName: "Set drag point to object",
  displayText: "{my}: Set drag point to {0}",
  description:
    "Updates the world-space point the object follows to another object's position. Call every tick while dragging.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "object",
      name: "Object",
      desc: "The object whose current position becomes the drag point.",
      type: "object",
    },
  ],
};

export const expose = true;

export default function (object) {
  this._setDragPointToObject(object);
}
