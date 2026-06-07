export const config = {
  listName: "Set break distance",
  displayText: "Set break distance to {0} ({1})",
  description:
    "If the gap to the drag point grows past the distance, the drag ends automatically. 0 disables this.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "distance",
      name: "Distance",
      desc: "Maximum gap in pixels before the drag auto-ends. 0 disables.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "action",
      name: "Action",
      desc: "Drop applies the throw and fires On Dropped; Cancel ends silently.",
      type: "combo",
      initialValue: "drop",
      items: [{ drop: "Drop" }, { cancel: "Cancel" }],
    },
  ],
};

export const expose = true;

export default function (distance, action) {
  this._setBreakDistance(distance, action);
}
