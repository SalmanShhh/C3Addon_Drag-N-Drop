export const config = {
  listName: "Start drag at object",
  displayText: "{my}: Start drag at {0} using {1}",
  description:
    "Begins dragging this object at the target's position and keeps the drag point glued to that object each tick, so it sticks to a moving target. Ignored if already dragging.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "object",
      name: "Object",
      desc: "The object to follow; the drag point sticks to its position each tick until dropped.",
      type: "object",
    },
    {
      id: "grabMode",
      name: "Grab mode",
      desc: "Keep the object's offset from the drag point, or centre it on the point.",
      type: "combo",
      initialValue: "keep_offset",
      items: [{ keep_offset: "Keep offset" }, { center_on_point: "Center on point" }],
    },
  ],
};

export const expose = true;

export default function (object, grabMode) {
  this._startDragAtObject(object, grabMode);
}
