# dsh-northstar

让 DeepSeek Harness 的每个任务都先对齐你的北极星指标。

`dsh-northstar` 是一个极简的本地插件：它把一个开关和一个配置按钮放进 Harness 首页，用户用自然语言保存一句北极星指标。每次任务在模型请求前经过 `agent/pre-step` 检查，先计算指标的六维加权评分，再判断当前任务与指标的匹配程度。

## 产品行为

- 首页入口只有一个状态色 switch 和一个“配置”按钮。
- 指标为空时自动展开输入框；已有指标时默认收起。
- 指标评分为 0–100 分，状态使用六档颜色：灰色 = 未设置，红色 = 偏弱，橙色 = 需要补强，黄色 = 基础明确，蓝色 = 较强，绿色 = 高质量。
- switch 可以随时开启或关闭；关闭时不做任务门禁。
- 指标保存在 Harness 的本地 `settings.yaml`，命名空间为 `northstar`，不上传云端。
- 任务检查发生在模型请求前。红色指标或无关任务会收到明确的“先修正指标/任务”上下文，避免模型直接执行偏离目标的工作。

首页入口使用 DSH 官方的 `shell.overlay` additive slot，定位在主内容区顶部左侧，随侧边栏展开、收起和拖拽自适应，不替换内置 Agent Preset，也不改动 DSH 的 DOM 或视觉 token。配置面板从入口下方展开，并在窄屏下限制宽度。

## 判断方式

当前版本完全本地化，不依赖额外模型调用：

1. 北极星指标按六个维度分别评分 0–5 分，并按优先级加权：用户价值（6）> 核心行为（5）> 商业关联（4）> 领先性（3）> 可影响性（2）> 可衡量性（1）。最终归一化为 0–100 分。
2. 任务匹配提取中英文关键词和中文双字片段，按与北极星的重合程度给出绿 / 黄 / 红；它和指标总分是两个独立判断。

这使检查稳定、快速且可测试，但它不是完整的语义推理器。后续可以在同一个 `agent/pre-step` 检查中增加可选的模型评审器，同时保留本地规则作为快速兜底。评分结果不会限制 Switch 的交互，开关只表达用户是否启用任务检查。

## 开发

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

插件包包含 Host、Typert Remote 和 Browser client 三个入口，并通过 `cordis.patch.yml` 插入 DSH profile。发布前请使用实际 Harness profile 安装并验证首页入口、设置持久化和首轮任务门禁。

## 安装

在已安装 DeepSeek Harness 的环境中，将本仓库作为 DSH 插件包加入目标 profile，并刷新 Web client：

```bash
dsh plugin --profile web add dsh-northstar
```

如果使用本地构建包，将 `dsh-northstar` 替换为本地包路径或已发布的包版本。

## License

Apache-2.0，见 [LICENSE](./LICENSE)。
