export const config = {
  listName: "On drag cancelled",
  displayText: "On drag cancelled",
  description:
    "Triggered when a drag ends via Drop (cancel) or a break-distance cancel. No throw is applied.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
