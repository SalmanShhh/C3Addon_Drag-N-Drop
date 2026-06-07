export const config = {
  listName: "Drop",
  displayText: "Drop ({0})",
  description:
    "Ends the current drag. Release applies the measured throw; Cancel ends silently. Ignored if not dragging.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "how",
      name: "How",
      desc: "Release fires On Dropped with the throw; Cancel fires On Drag Cancelled with no throw.",
      type: "combo",
      initialValue: "release",
      items: [{ release: "Release" }, { cancel: "Cancel" }],
    },
  ],
};

export const expose = true;

export default function (how) {
  this._drop(how);
}
