export const config = {
  returnType: "number",
  description: "World-space Y where the object was when grabbing started.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._grabOriginY;
}
