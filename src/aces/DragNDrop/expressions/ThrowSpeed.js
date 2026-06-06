export const config = {
  returnType: "number",
  description: "Magnitude of the final release velocity.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._throwSpeed;
}
