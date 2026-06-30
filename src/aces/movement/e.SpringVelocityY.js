export const config = {
  returnType: "number",
  description:
    "Y component of the object's current spring velocity in pixels per second. Valid while Follow Mode is Spring Physics.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._springVelY;
}
