const path = require("path");

module.exports = [
  {
    // Configuration for the renderer process (React)
    entry: "./src/renderer/index.tsx",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    target: "electron-renderer",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  },
  {
    // Configuration for the main process (Electron)
    entry: "./src/main/main.ts",
    output: {
      filename: "main.js",
      path: path.resolve(__dirname, "dist"),
    },
    target: "electron-main",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  },
];
