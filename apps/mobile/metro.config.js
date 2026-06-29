// Metro 설정 — pnpm 모노레포 지원 (Expo SDK 51)
//
// 이유: 앱이 @dash2zero/contracts · @dash2zero/design-tokens (packages/*) 를 workspace로 의존한다.
// metro.config.js 없이는 Metro가 projectRoot(apps/mobile) 밖의 packages/* 소스를 watch/read 하지
// 못해 "Unable to resolve module @dash2zero/..." 로 번들이 실패한다.
//
// getDefaultConfig(expo/metro-config)는 tsconfig.json paths(@/ · @dash2zero/*) 해석을 유지하므로
// 별도 babel module-resolver 불필요.
//
// 참고: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) repo 루트까지 watch (packages/* 소스 변경 감지 + 번들 포함)
config.watchFolders = [workspaceRoot];

// 2) node_modules 탐색 경로: 앱 → 루트 순 (pnpm hoist 대응)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3) pnpm 심볼릭 링크 해석 (packages/* → node_modules/@dash2zero/* symlink)
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
