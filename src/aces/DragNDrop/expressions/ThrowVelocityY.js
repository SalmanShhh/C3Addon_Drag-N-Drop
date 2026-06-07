export const config = {
  returnType: "number",
  description: "Y component of the measured throw velocity. Use inside On Dropped.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._throwVelY;
}
