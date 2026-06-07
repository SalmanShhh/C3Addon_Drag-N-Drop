export const config = {
  returnType: "string",
  description:
    'Why the drag ended: "manual" for a Drop action, "broke_distance" for a break-distance end.',
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this._dropReason;
}
