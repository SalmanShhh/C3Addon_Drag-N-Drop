export const config = {
  listName: "Set axis lock",
  displayText: "Set axis lock to {0}",
  description: "Constrains the dragged object to a single axis.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "axis",
      name: "Axis",
      desc: "Choose the lock mode.",
      type: "combo",
      initialValue: "0",
      items: [{ 0: "None" }, { 1: "Horizontal" }, { 2: "Vertical" }],
    },
  ],
};

export const expose = true;

export default function (axis) {
  this._setAxisLock(axis);
}
