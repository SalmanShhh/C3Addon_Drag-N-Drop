export const config = {
  listName: "Set enabled",
  displayText: "Set enabled to {0}",
  description: "Enables or disables the drag behavior.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the behavior should be enabled.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._setEnabled(enabled);
}
