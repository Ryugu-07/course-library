# P04 编译器后端：IR、SSA、寄存器分配与窥孔优化

这是一个 6–8 周、教师提供骨架的课程大项目。目标是把一个已有的树遍历前端/解释器
接到一个可观察的后端流水线：三地址码 IR → CFG → SSA → 优化 → 寄存器分配 → 目标代码。
本目录是教师版作业说明与最小脚手架，不包含完整的 SSA、优化或寄存器分配答案。

## 先修

- `comp-01/02`：词法、语法、AST、解释执行与闭包；
- `csapp-01`：整数表示、调用约定、汇编基本结构；
- `perf-01/02`：基准测量、局部性与编译器优化的基本方法；
- 能读写 Python 3.10+，能使用 `unittest`、`dataclasses` 和命令行；
- 了解 CFG、支配关系、活跃变量和图着色的基本定义。

## 目标

完成后，学生应能：

1. 设计一个可验证的三地址码 IR，并把基本块组织成 CFG；
2. 解释并实现变量重命名、支配边界与 φ 节点插入；
3. 实现至少三种保持语义的优化，并用解释器作为 oracle；
4. 从活跃变量构造冲突图，完成有限寄存器分配与 spill；
5. 输出 LLVM IR、字节码 VM 或受限 RISC-V 汇编中的一种，并报告正确性和性能证据。

## 周期与组队

建议 6–8 周，2–3 人一组。每周至少提交一次可运行的阶段分支或日志。个人完成时，
仍需按同样的里程碑交付；组员必须在设计报告中标记各自负责的模块和互审记录。

## 目录

| 路径 | 教师提供的内容 |
|---|---|
| `starter/ir.py` | IR/CFG 数据结构、JSON fixture 解析器、后端阶段接口；核心阶段保留 TODO |
| `starter/driver.py` | fixture 驱动与 `--dump-ir/--dump-ssa/--dump-regalloc` 命令入口 |
| `fixtures/branch_loop.json` | 含分支和循环的非 SSA 机器可读场景 |
| `tests/test_scaffold.py` | 当前就应通过的文件、签名、fixture 与驱动结构测试 |
| `acceptance/` | 学生实现后运行的契约测试；默认跳过，避免 TODO 让仓库 CI 失败 |
| `scripts/verify_scaffold.py` | 仅依赖 Python 标准库的脚手架完整性检查 |
| `DESIGN.md` | 学生设计报告模板 |
| `rubric.md` | 可直接下发的细化评分表 |

## 里程碑

1. **M1 · IR 与 CFG（第 1–2 周）**：把给定 AST/fixture 降为三地址码；基本块边界、入口、
   后继/前驱和终止指令可打印、可验证。
2. **M2 · SSA（第 3 周）**：实现支配树/支配边界、φ 插入和重命名；证明或测试循环、分支
   汇合、嵌套作用域下每个 SSA 名字只有一个定义。
3. **M3 · 优化（第 4–5 周）**：实现常量折叠/传播、拷贝传播、死代码消除中的至少三项，
   每个 pass 可单独开启、关闭并和解释器结果对照。
4. **M4 · 寄存器分配（第 6 周）**：完成活跃变量分析、冲突图、k 色着色、spill 和必要的
   load/store；调用约定和控制流边界不能被破坏。
5. **M5 · 目标与报告（第 7–8 周）**：完成一种目标格式，加入错误诊断、benchmark、失败尝试
   和设计报告；公开/隐藏程序都要通过语义 oracle。

## 学生任务边界

教师提供 IR 字段约定、fixture、驱动入口、公开结构测试和解释器/golden output 接口。
学生必须实现核心算法、必要的数据结构、阶段间验证、补充测试和报告。不得把一个完整的
LLVM/编译器源码树当作答案提交，也不得把生产编译器的后端源码直接复制进项目。允许使用
标准库和目标平台的编译器工具，但必须说明外部工具负责了哪一层。

不要求学生重写 L04 的词法/解析器；可以使用等价的 AST 输入适配器。前端适配器不是本项目
评分重点，后端阶段的输入必须能由 `starter/ir.py` 的公开 schema 重建。

## 给定接口契约

下面的名字和参数是公开契约；返回值的具体内部表示由学生在 `DESIGN.md` 中固定。

```python
def parse_module(payload: Mapping[str, Any]) -> Module: ...
def validate_module(module: Module) -> list[str]: ...
def to_ssa(module: Module) -> Module: ...
def optimize(module: Module, passes: Sequence[str]) -> Module: ...
def allocate_registers(module: Module, registers: Sequence[str]) -> RegisterAllocation: ...
def emit(module: Module, target: str) -> str: ...
def compile_program(module: Module, *, target: str, opt_level: int = 0) -> CompileResult: ...
```

脚手架只实现数据结构、fixture 解析、结构验证和可读 dump；`to_ssa`、`optimize`、
`allocate_registers`、`emit`、`compile_program` 明确保留 `TODO/NotImplementedError`。
学生实现后仍需保持以下不变量：

- CFG 的每个 successor 都存在，终止指令与边一致；
- SSA 名字单赋值，φ 的 incoming 与前驱边一一对应；
- 优化前后解释器输出、异常行为和副作用顺序一致；
- spill 不改变调用约定、递归和局部变量作用域；
- `--dump-ir`、`--dump-ssa`、`--dump-regalloc` 输出能定位到函数、块和指令。

## 运行与验收命令

在本项目目录执行：

```bash
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests -v
python3 -m py_compile starter/*.py scripts/verify_scaffold.py tests/test_scaffold.py acceptance/test_student_acceptance.py
python3 starter/driver.py --fixture fixtures/branch_loop.json --dump-ir
RUN_STUDENT_ACCEPTANCE=1 python3 -m unittest discover -s acceptance -v
```

前四条是脚手架检查，未完成核心算法也应通过。最后一条是学生实现后的验收入口；在当前
骨架上会因为 SSA/编译阶段尚未实现而失败，不能把它加入默认 CI 的必过 job。

推荐学生另加：

```bash
python3 starter/driver.py --fixture fixtures/branch_loop.json --dump-ssa
python3 -m unittest discover -s tests -v
python3 -m unittest discover -s acceptance -v
```

## 故障、边界与性能测试

公开测试至少覆盖：空函数、单块函数、无后继/多余后继、不可达块、分支汇合、循环回边、
嵌套循环、递归调用、常量除零、未定义变量和重复 SSA 定义。学生应补充异常信息测试，
并确保 malformed JSON 不会静默生成错误代码。

隐藏验收建议注入：随机丢弃或打乱基本块顺序、深度 20 以上的循环、超过寄存器数的长生命期、
递归深度、spill 后的异常路径和多返回点。性能记录至少包括编译耗时、IR 指令数、spill
数量和目标程序 wall time；优化后的 benchmark 至少有两个输入出现可测改善，且不能靠删掉
副作用或缩小输入作弊。

## Rubric（40/25/15/10/10）

| 项目 | 权重 | 评分要点 |
|---|---:|---|
| 功能正确性 | 40% | IR/CFG、SSA、优化、寄存器分配/目标输出的公开与隐藏语义测试 |
| 故障与边界 | 25% | 循环、递归、异常、不可达块、寄存器不足和 malformed input |
| 性能/资源 | 15% | 编译和运行 benchmark、spill/代码大小/运行时间的可复现实验 |
| 结构与文档 | 10% | 模块边界、诊断、测试组织、可读 dump 和 API 兼容性 |
| 报告与反思 | 10% | 设计取舍、失败尝试、oracle 证据、成员分工与限制 |

详见 [`rubric.md`](rubric.md)。

## 交付物

- 可从干净环境运行的源代码与锁定的运行命令；
- `README.md`、`DESIGN.md`、补充测试和至少一个成功/失败 benchmark 日志；
- 2–6 页设计报告，包含 CFG/SSA 示例、优化前后差异、寄存器分配/spill 例子和正确性证据；
- 组员分工、代码审查记录、已知限制和复现实验的机器/编译器信息。

## 学术诚信

可以阅读论文、教材、官方文档和标准库源码；引用外部代码、算法伪代码或自动生成内容时，
必须在报告和提交记录中注明来源、改动范围和理解说明。不得共享未公开参考实现、绕过隐藏
测试、篡改 oracle、伪造 benchmark 或把不同组员的提交伪装成个人工作。

## 平台条件

脚手架与公开结构测试只需要 Python 3.10+ 和标准库，可在 Mac/Windows/Linux 上运行。目标
输出可选 LLVM IR、字节码或受限 RISC-V；若选择 LLVM/RISC-V，报告中写明版本和额外安装项。
GPU 不是本项目要求，CI 不应依赖 GPU。

## 可选挑战

- 窥孔优化：代数恒等式、冗余 move、短跳转合并，并给出反例；
- 尾递归优化或简单内联，同时说明栈追踪变化；
- 线性扫描与图着色的对比，报告 spill 率和编译时间；
- 将一个优化 pass 写成可检查的不变量/性质测试，而不只依赖例子。

## 讲义映射

- 主线：[`comp-03-codegen.md`](../../lectures/comp-03-codegen.md)；
- 前端输入：`comp-01/02` 与 [`labs/L04-interpreter`](../../labs/L04-interpreter/README.md)；
- 汇编/调用约定：`csapp-01`；
- 活跃变量与不动点：`adv-02-spectral-online`、算法线图算法；
- 局部性与 benchmark：`perf-01`、`perf-02-cache-practice`。
