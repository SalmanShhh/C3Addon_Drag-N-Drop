export const config = {
  listName: "Start drag",
  displayText: "Start drag at ({0}, {1}) using {2}",
  description:
    "Begins dragging this object toward a drag point. Ignored if already dragging.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "dragPointX",
      name: "Drag point X",
      desc: "World-space X of the point the object will follow.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "dragPointY",
      name: "Drag point Y",
      desc: "World-space Y of the point the object will follow.",
      type: "number",
      initialValue: "0",
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

export default function (dragPointX, dragPointY, grabMode) {
  this._startDrag(dragPointX, dragPointY, grabMode);
}
