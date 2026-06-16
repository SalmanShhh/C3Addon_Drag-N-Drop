export const config = {
  returnType: "number",
  description:
    "UID of the object this behavior is dragging, or -1 if it is not currently dragging.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._dragging && this.instance ? this.instance.uid : -1;
}
