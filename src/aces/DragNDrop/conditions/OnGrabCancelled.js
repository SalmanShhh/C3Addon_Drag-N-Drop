export const config = {
  listName: "On grab cancelled",
  displayText: "On grab cancelled",
  description: "Triggered when drag is cancelled without release.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
