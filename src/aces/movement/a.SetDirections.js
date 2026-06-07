export const config = {
  listName: "Set directions",
  displayText: "Set directions to {0}",
  description:
    "Constrains drag movement, 8Direction style: free, a single axis, or snapped to 4 / 8 directions.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "directions",
      name: "Directions",
      desc: "How the dragged object's movement is constrained.",
      type: "combo",
      initialValue: "free",
      items: [
        { free: "Free (360)" },
        { up_down: "Up & Down" },
        { left_right: "Left & Right" },
        { four_dir: "4 Directions" },
        { eight_dir: "8 Directions" },
      ],
    },
  ],
};

export const expose = true;

export default function (directions) {
  this._setDirections(directions);
}
