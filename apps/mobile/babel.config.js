module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    plugins: [
      // expo-router/babel은 SDK 50+에서 deprecated → babel-preset-expo가 대체 처리 (제거함)
      // react-native-reanimated/plugin은 반드시 plugins 배열의 마지막에 위치
      // (worklet 변환 정합 — WORKLET_GUIDE §4.1, ADR-0009 D-033 봉인)
      "react-native-reanimated/plugin",
    ],
  };
};
