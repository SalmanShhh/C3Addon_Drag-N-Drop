export const config = {
  listName: "On dropped",
  displayText: "On dropped",
  description:
    "Triggered when a drag ends via Drop (release) or a break-distance drop. The throw is available.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
