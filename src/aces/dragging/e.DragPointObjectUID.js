export const config = {
  returnType: "number",
  description:
    "UID of the object the drag point is glued to (set by Start drag at object), or -1 if the drag point is a free position.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._followUid;
}
