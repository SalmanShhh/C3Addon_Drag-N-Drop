export const config = {
  returnType: "number",
  description:
    "UID of the object snapped to on the last drop, or -1 if the snap was a position or no snap occurred.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._snappedUid;
}
