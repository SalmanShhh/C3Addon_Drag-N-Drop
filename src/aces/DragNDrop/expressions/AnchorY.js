export const config = {
  returnType: "number",
  description: "Current world-space Y of the anchor point.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._anchorY;
}
