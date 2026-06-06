export const config = {
  returnType: "number",
  description: "Current Y component of the grab offset vector.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._grabOffsetY;
}
