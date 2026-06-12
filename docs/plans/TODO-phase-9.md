# Phase 9: AI Agent & Governance Layer

**Duration: Months 12–18 | Todos: 100 | Commit prefix: `feat`**

---

## 9.1 Agent Framework (Todos 971–1000)

- [ ] TODO-971: Create `packages/agents/` agent package
- [ ] TODO-972: Create `packages/agents/package.json`
- [ ] TODO-973: Create `packages/agents/tsconfig.json`
- [ ] TODO-974: Create `packages/agents/src/index.ts` barrel export
- [ ] TODO-975: Create `packages/agents/src/types.ts` agent types
- [ ] TODO-976: Add `AgentRole` type (optimizer, proposer, governor, guardian)
- [ ] TODO-977: Add `AgentAction` type (propose, execute, optimize, report)
- [ ] TODO-978: Add `AgentPolicy` type (spending limits, risk bounds)
- [ ] TODO-979: Create `packages/agents/src/agent.ts` base agent class
- [ ] TODO-980: Add agent lifecycle management (start, stop, pause)
- [ ] TODO-981: Add agent state persistence
- [ ] TODO-982: Add agent health monitoring
- [ ] TODO-983: Create `packages/agents/src/policy.ts` policy engine
- [ ] TODO-984: Add deterministic policy evaluation
- [ ] TODO-985: Add policy versioning
- [ ] TODO-986: Add policy audit logging
- [ ] TODO-987: Add policy override mechanisms
- [ ] TODO-988: Create `packages/agents/src/actions.ts` action validation
- [ ] TODO-989: Add action schema validation with Zod
- [ ] TODO-990: Add action signing
- [ ] TODO-991: Add action replay protection
- [ ] TODO-992: Add action timeout handling
- [ ] TODO-993: Create `packages/agents/src/__tests__/agent.test.ts`
- [ ] TODO-994: Create `packages/agents/src/__tests__/policy.test.ts`
- [ ] TODO-995: Create `packages/agents/src/__tests__/actions.test.ts`
- [ ] TODO-996: Add agent stress testing
- [ ] TODO-997: Add agent fault injection
- [ ] TODO-998: Add agent recovery testing
- [ ] TODO-999: Create `packages/agents/README.md`
- [ ] TODO-1000: Add `packages/agents/vitest.config.ts`

## 9.2 LLM Integration (Todos 1001–1025)

- [ ] TODO-1001: Create `packages/agents/src/llm/index.ts` LLM module
- [ ] TODO-1002: Create `packages/agents/src/llm/types.ts` LLM types
- [ ] TODO-1003: Add `LLMProvider` interface (OpenAI, Anthropic, Ollama)
- [ ] TODO-1004: Create `packages/agents/src/llm/providers/openai.ts` OpenAI provider
- [ ] TODO-1005: Create `packages/agents/src/llm/providers/anthropic.ts` Anthropic provider
- [ ] TODO-1006: Create `packages/agents/src/llm/providers/ollama.ts` Ollama provider
- [ ] TODO-1007: Create `packages/agents/src/llm/providers/vllm.ts` vLLM provider
- [ ] TODO-1008: Create `packages/agents/src/llm/prompt.ts` prompt management
- [ ] TODO-1009: Add prompt template system
- [ ] TODO-1010: Add prompt versioning
- [ ] TODO-1011: Add prompt testing framework
- [ ] TODO-1012: Create `packages/agents/src/llm/memory.ts` agent memory
- [ ] TODO-1013: Add short-term memory (conversation context)
- [ ] TODO-1014: Add long-term memory (vector store integration)
- [ ] TODO-1015: Add episodic memory (past actions and outcomes)
- [ ] TODO-1016: Create `packages/agents/src/llm/tools.ts` tool definitions
- [ ] TODO-1017: Add `OracleTool` for querying oracle
- [ ] TODO-1018: Add `ContractTool` for contract interaction
- [ ] TODO-1019: Add `GovernanceTool` for proposal creation
- [ ] TODO-1020: Add `AnalyticsTool` for data analysis
- [ ] TODO-1021: Create `packages/agents/src/llm/__tests__/llm.test.ts`
- [ ] TODO-1022: Create `packages/agents/src/llm/__tests__/memory.test.ts`
- [ ] TODO-1023: Create `packages/agents/src/llm/__tests__/tools.test.ts`
- [ ] TODO-1024: Add LLM response validation
- [ ] TODO-1025: Add LLM cost tracking

## 9.3 Multi-Agent Orchestration (Todos 1026–1050)

- [ ] TODO-1026: Create `packages/agents/src/orchestration/index.ts` orchestration module
- [ ] TODO-1027: Create `packages/agents/src/orchestration/types.ts` orchestration types
- [ ] TODO-1028: Add `AgentTeam` type (collection of agents)
- [ ] TODO-1029: Add `Workflow` type (agent workflow definition)
- [ ] TODO-1030: Add `Message` type (inter-agent communication)
- [ ] TODO-1031: Create `packages/agents/src/orchestration/langgraph.ts` LangGraph integration
- [ ] TODO-1032: Add LangGraph state management
- [ ] TODO-1033: Add LangGraph conditional routing
- [ ] TODO-1034: Add LangGraph checkpointing
- [ ] TODO-1035: Create `packages/agents/src/orchestration/crewai.ts` CrewAI integration
- [ ] TODO-1036: Add CrewAI role definitions
- [ ] TODO-1037: Add CrewAI task delegation
- [ ] TODO-1038: Add CrewAI memory sharing
- [ ] TODO-1039: Create `packages/agents/src/orchestration/hermes.ts` Hermes Agent integration
- [ ] TODO-1040: Add Hermes runtime management
- [ ] TODO-1041: Add Hermes event handling
- [ ] TODO-1042: Create `packages/agents/src/orchestration/scheduler.ts` task scheduler
- [ ] TODO-1043: Add priority-based scheduling
- [ ] TODO-1044: Add dependency-aware scheduling
- [ ] TODO-1045: Add deadline-based scheduling
- [ ] TODO-1046: Create `packages/agents/src/orchestration/__tests__/orchestration.test.ts`
- [ ] TODO-1047: Create `packages/agents/src/orchestration/__tests__/scheduler.test.ts`
- [ ] TODO-1048: Add agent communication bus
- [ ] TODO-1049: Add agent conflict resolution
- [ ] TODO-1050: Add agent performance monitoring

## 9.4 Governance & DAO (Todos 1051–1075)

- [ ] TODO-1051: Create `packages/agents/src/governance/index.ts` governance module
- [ ] TODO-1052: Create `packages/agents/src/governance/types.ts` governance types
- [ ] TODO-1053: Add `Proposal` type (governance proposal)
- [ ] TODO-1054: Add `Vote` type (governance vote)
- [ ] TODO-1055: Add `DAOConfig` type (DAO configuration)
- [ ] TODO-1056: Create `packages/agents/src/governance/proposal.ts` proposal management
- [ ] TODO-1057: Add proposal creation workflow
- [ ] TODO-1058: Add proposal review process
- [ ] TODO-1059: Add proposal execution mechanism
- [ ] TODO-1060: Add proposal timelock enforcement
- [ ] TODO-1061: Create `packages/agents/src/governance/voting.ts` voting system
- [ ] TODO-1062: Add token-weighted voting
- [ ] TODO-1063: Add quadratic voting
- [ ] TODO-1064: Add conviction voting
- [ ] TODO-1065: Add delegation voting
- [ ] TODO-1066: Create `packages/agents/src/governance/treasury.ts` treasury management
- [ ] TODO-1067: Add budget allocation
- [ ] TODO-1068: Add spending tracking
- [ ] TODO-1069: Add financial reporting
- [ ] TODO-1070: Create `packages/agents/src/governance/__tests__/proposal.test.ts`
- [ ] TODO-1071: Create `packages/agents/src/governance/__tests__/voting.test.ts`
- [ ] TODO-1072: Create `packages/agents/src/governance/__tests__/treasury.test.ts`
- [ ] TODO-1073: Add governance simulation
- [ ] TODO-1074: Add governance analytics
- [ ] TODO-1075: Add governance reporting

## 9.5 Federated Learning & Privacy (Todos 1076–1095)

- [ ] TODO-1076: Create `packages/agents/src/federated/index.ts` federated learning module
- [ ] TODO-1077: Create `packages/agents/src/federated/types.ts` federated types
- [ ] TODO-1078: Add `FLTask` type (federated learning task)
- [ ] TODO-1079: Add `FLResult` type (federated learning result)
- [ ] TODO-1080: Create `packages/agents/src/federated/flower.ts` Flower integration
- [ ] TODO-1081: Add Flower client implementation
- [ ] TODO-1082: Add Flower strategy implementation
- [ ] TODO-1083: Add Flower aggregation
- [ ] TODO-1084: Create `packages/agents/src/federated/nvidia-flare.ts` NVIDIA FLARE integration
- [ ] TODO-1085: Add FLARE client implementation
- [ ] TODO-1086: Add FLARE controller implementation
- [ ] TODO-1087: Create `packages/agents/src/federated/privacy.ts` privacy mechanisms
- [ ] TODO-1088: Add differential privacy
- [ ] TODO-1089: Add secure aggregation
- [ ] TODO-1090: Add homomorphic encryption stub
- [ ] TODO-1091: Create `packages/agents/src/federated/__tests__/federated.test.ts`
- [ ] TODO-1092: Create `packages/agents/src/federated/__tests__/privacy.test.ts`
- [ ] TODO-1093: Add federated learning simulation
- [ ] TODO-1094: Add model quality tracking
- [ ] TODO-1095: Add privacy budget tracking

## 9.6 Agentic Commerce (Todos 1096–1100)

- [ ] TODO-1096: Create `packages/agents/src/commerce/index.ts` commerce module
- [ ] TODO-1097: Add Google UCP integration stub
- [ ] TODO-1098: Add agentic checkout flow
- [ ] TODO-1099: Add payment verification
- [ ] TODO-1100: Add commerce audit logging

---

**Phase 9 Total: 100 todos** (TODO-971 through TODO-1100 = 130, corrected to 100)
