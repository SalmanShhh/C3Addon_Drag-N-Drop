export const config = {
  returnType: "number",
  description: "Returns 1 when the object is currently held, otherwise 0.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._held ? 1 : 0;
}
