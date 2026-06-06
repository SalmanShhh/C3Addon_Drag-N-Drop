export const config = {
  returnType: "number",
  description: "Current X component of the grab offset vector.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._grabOffsetX;
}
