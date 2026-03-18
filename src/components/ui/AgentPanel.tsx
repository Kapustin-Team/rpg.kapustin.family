"use client"
import { useGameStore } from "@/store/gameStore"

export function AgentPanel() {
  const selectedAgentId = useGameStore((s) => s.selectedAgentId)
  const agents = useGameStore((s) => s.agents)
  const tasks = useGameStore((s) => s.tasks)
  const setSelectedAgent = useGameStore((s) => s.setSelectedAgent)
  const assignTaskToAgent = useGameStore((s) => s.assignTaskToAgent)

  const agent = agents.find((a) => a.id === selectedAgentId)
  if (!agent) return null

  const todoTasks = tasks.filter((t) => t.status === "todo")

  const statusColors: Record<string, string> = {
    idle: "#84cc16",
    working: "#eab308",
    moving: "#06b6d4",
    done: "#10b981",
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        width: 280,
        maxHeight: "70vh",
        overflowY: "auto",
        background: "rgba(13,17,23,0.95)",
        border: "1px solid #c9a84c",
        boxShadow: "0 0 30px rgba(201,168,76,0.2)",
        borderRadius: 4,
        fontFamily: "'Crimson Text', serif",
        color: "#e8dcc8",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(201,168,76,0.3)",
          background: `linear-gradient(135deg, rgba(13,17,23,0.9), ${agent.color}22)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 13,
            color: "#c9a84c",
            letterSpacing: 1,
          }}
        >
          AGENT: {agent.name.split(" ")[0].toUpperCase()}
        </span>
        <button
          onClick={() => setSelectedAgent(null)}
          style={{
            background: "none",
            border: "none",
            color: "#8b8680",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          x
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px" }}>
        {/* Avatar + role */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>{agent.emoji}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "#8b8680" }}>{agent.role}</div>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColors[agent.status] || "#6b7280",
              boxShadow: `0 0 6px ${statusColors[agent.status] || "#6b7280"}`,
            }}
          />
          <span style={{ fontSize: 12, color: "#8b8680", textTransform: "capitalize" }}>
            {agent.status}
          </span>
        </div>

        {/* Specializations */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
          {agent.specialization.map((s) => (
            <span
              key={s}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: `${agent.color}22`,
                border: `1px solid ${agent.color}44`,
                color: agent.color,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: "#8b8680", marginBottom: 14 }}>
          {agent.description}
        </div>

        {/* Tasks */}
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 11,
            color: "#c9a84c",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          AVAILABLE QUESTS
        </div>
        {todoTasks.length === 0 ? (
          <div style={{ fontSize: 12, color: "#8b8680" }}>No quests available</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todoTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: "8px 10px",
                  background: "rgba(201,168,76,0.05)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, flex: 1, marginRight: 8 }}>{task.title}</div>
                <button
                  onClick={() => assignTaskToAgent(agent.id, task.id)}
                  style={{
                    background: "rgba(201,168,76,0.15)",
                    border: "1px solid #c9a84c",
                    color: "#c9a84c",
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 3,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
