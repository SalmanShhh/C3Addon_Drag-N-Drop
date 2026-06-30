export const config = {
  listName: "Set grid",
  displayText: "{my}: Set grid to {0} x {1} (origin {2}, {3})",
  description:
    "Sets the tile grid used by the Grid follow mode: cell width and height plus an origin offset. While Follow Mode is Grid, the object snaps to the nearest cell. A width or height of 0 leaves that axis unsnapped.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "cellWidth",
      name: "Cell width",
      desc: "Grid cell width in pixels. 0 leaves the X axis free (unsnapped).",
      type: "number",
      initialValue: "32",
    },
    {
      id: "cellHeight",
      name: "Cell height",
      desc: "Grid cell height in pixels. 0 leaves the Y axis free (unsnapped).",
      type: "number",
      initialValue: "32",
    },
    {
      id: "originX",
      name: "Origin X",
      desc: "X offset of the grid origin in pixels. Shifts where cell boundaries fall.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "originY",
      name: "Origin Y",
      desc: "Y offset of the grid origin in pixels. Shifts where cell boundaries fall.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (cellWidth, cellHeight, originX, originY) {
  this._setGrid(cellWidth, cellHeight, originX, originY);
}
