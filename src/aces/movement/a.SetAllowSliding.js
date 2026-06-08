export const config = {
  listName: "Set allow sliding",
  displayText: "Set allow sliding {0}",
  description:
    "With solid collision on: when enabled the object slides along solids; when disabled it stops dead against them.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "On slides along blocking solids; Off stops the object dead at the wall.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._setAllowSliding(enabled);
}
