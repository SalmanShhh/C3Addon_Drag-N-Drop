export const config = {
  listName: "On hit solid",
  displayText: "On hit solid",
  description:
    "Triggered the first tick the dragged object is pushed out of a solid (solid collision must be on).",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
