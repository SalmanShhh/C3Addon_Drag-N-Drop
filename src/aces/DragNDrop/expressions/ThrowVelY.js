export const config = {
  returnType: "number",
  description: "Y component of the final release velocity.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._throwVelY;
}
