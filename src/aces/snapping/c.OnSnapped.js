export const config = {
  listName: "On snapped",
  displayText: "On snapped",
  description:
    "Triggered after a release that lands within snap radius of a target. Fires alongside On Dropped. Read SnapTargetX, SnapTargetY, and SnappedObjectUID.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = false;

export default function () {
  return true;
}
