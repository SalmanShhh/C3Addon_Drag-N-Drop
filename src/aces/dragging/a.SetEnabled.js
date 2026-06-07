export const config = {
  listName: "Set enabled",
  displayText: "Set enabled {0}",
  description: "Enables or disables the behaviour. Disabling cancels any in-progress drag.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the behaviour is active.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._setEnabled(enabled);
}
