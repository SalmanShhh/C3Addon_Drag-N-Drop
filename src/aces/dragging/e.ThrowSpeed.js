export const config = {
  returnType: "number",
  description: "Magnitude of the throw velocity. Use inside On Dropped.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._throwSpeed;
}
