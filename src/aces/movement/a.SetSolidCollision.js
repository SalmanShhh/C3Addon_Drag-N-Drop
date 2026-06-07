export const config = {
  listName: "Set solid collision",
  displayText: "Set solid collision {0}",
  description:
    "When on, the dragged object is pushed out of solids each tick and cannot be dragged through them.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether solid push-out is active during the drag.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._setSolidCollision(enabled);
}
