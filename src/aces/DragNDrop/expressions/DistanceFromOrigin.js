export const config = {
  returnType: "number",
  description: "Distance from the grab origin to the object's current position.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._distanceFromOrigin;
}
