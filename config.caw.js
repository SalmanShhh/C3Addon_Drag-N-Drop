import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.BEHAVIOR;
export const type = PLUGIN_TYPE.OBJECT;
export const id = "salmanshh_dragndrop";
export const name = "Drag N Drop";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "SalmanShh";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description = "Event-driven drag & drop: you decide when a drag starts and stops, and the object follows a drag point you update each tick. A drop-in replacement for Construct 3's built-in Drag & Drop, driven through Start Drag / Drop / Set Drag Point actions so a controller, touch gesture, AI routine, or virtual cursor can all drive it. Optional solid push-out, axis lock, break distance, and automatic throw-velocity measurement.";
export const category = ADDON_CATEGORY.GENERAL;

export const hasDomside = false;
export const files = {
  extensionScript: {
    enabled: false, // set to false to disable the extension script
    watch: true, // set to true to enable live reload on changes during development
    targets: ["x86", "x64"],
    // you don't need to change this, the build step will rename the dll for you. Only change this if you change the name of the dll exported by Visual Studio
    name: "MyExtension",
  },
  fileDependencies: [],
  remoteFileDependencies: [
    // {
    //   src: "https://example.com/api.js", // Must use https:// or same-protocol // URLs. http:// is not allowed.
    //   type: "" // Optional: "" or "module". Empty string or omit for classic script.
    // }
  ],
  cordovaPluginReferences: [],
  cordovaResourceFiles: [],
};

// categories that are not filled will use the folder name
export const aceCategories = {};

export const info = {
  // icon: "icon.svg",
  // PLUGIN world only
  // defaultImageUrl: "default-image.png",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only
    IsOnlyOneAllowed: false,

    // PLUGIN world only
    IsResizable: false,
    IsRotatable: false,
    Is3D: false,
    HasImage: false,
    IsTiled: false,
    SupportsZElevation: false,
    SupportsColor: false,
    SupportsEffects: false,
    MustPreDraw: false,

    // PLUGIN object only
    IsSingleGlobal: true,
  },
  // PLUGIN only
  AddCommonACEs: {
    Position: false,
    SceneGraph: false,
    Size: false,
    Angle: false,
    Appearance: false,
    ZOrder: false,
  },
};

export const properties = [
  // A small, simple panel: the common defaults live here, and every one can
  // still be overridden at runtime through its matching action.
  // NOTE: this order must match the reads in src/runtime/instance.js.
  {
    type: PROPERTY_TYPE.CHECK,
    id: "enabled",
    options: {
      initialValue: true,
      interpolatable: false,
    },
    name: "Enabled",
    desc: "Whether the behaviour is active when the layout starts.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "followSpeed",
    options: {
      initialValue: 0,
      minValue: 0,
      interpolatable: false,
    },
    name: "Follow Speed",
    desc: "Max speed in pixels per second the object catches up to the drag point. 0 = instant snap.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "directions",
    options: {
      initialValue: "free",
      interpolatable: false,
      items: [
        { free: "Free (360)" },
        { up_down: "Up & Down" },
        { left_right: "Left & Right" },
        { four_dir: "4 Directions" },
        { eight_dir: "8 Directions" },
      ],
    },
    name: "Directions",
    desc: "Constrains drag movement, 8Direction style: free, single-axis, or snapped to 4 / 8 directions.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "solidCollision",
    options: {
      initialValue: false,
      interpolatable: false,
    },
    name: "Solid Collision",
    desc: "When on, the dragged object is pushed out of solids and cannot be dragged through them.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "breakDistance",
    options: {
      initialValue: 0,
      minValue: 0,
      interpolatable: false,
    },
    name: "Break Distance",
    desc: "Gap to the drag point that auto-ends the drag. 0 disables it.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "breakAction",
    options: {
      initialValue: "drop",
      interpolatable: false,
      items: [{ drop: "Drop" }, { cancel: "Cancel" }],
    },
    name: "Break Action",
    desc: "What a break-distance end does: Drop applies the throw, Cancel ends silently.",
  },
];
