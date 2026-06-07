export const config = {
  returnType: "number",
  description:
    "Current gap in pixels between the object and the drag point. Grows while blocked by a solid.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._distanceFromPoint;
}
