# 单文件 3.0 维护说明

本目录用于维护 `class-credit-system-single-v3.html` 单文件版本。

## 分支与版本

- 维护分支: `html-v3`
- 版本号: `v3.*`
- 首次发布: `v3.0.0`

## 本地运行

单文件可直接用浏览器打开:

```bash
open single-html/class-credit-system-single-v3.html
```

或使用任意静态服务器打开。

## 发布流程（3.x 线）

1. 在 `html-v3` 分支开发并合并 PR
2. 更新 `single-html/class-credit-system-single-v3.html`
3. 打 tag（例如 `v3.0.1`）并创建 Release

## 协作约定

- 3.x 功能只进入 `html-v3`
- 2.x 功能只进入 `main`
- 仅在通用问题场景使用 `cherry-pick`，避免频繁双向同步
