export const config = {
  listName: "On distance limit reached",
  displayText: "On distance limit reached",
  description: "Triggered when the held object hits its clamp limit.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
