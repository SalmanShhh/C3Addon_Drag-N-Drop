export const config = {
  returnType: "number",
  description: "Current distance clamp radius, or 0 if unconstrained.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._distanceClamp;
}
