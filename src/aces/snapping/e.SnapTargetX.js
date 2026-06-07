export const config = {
  returnType: "number",
  description:
    "X of the nearest snap target. While dragging it tracks the nearest target; after a snap it is the snapped position.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._snapTargetX;
}
