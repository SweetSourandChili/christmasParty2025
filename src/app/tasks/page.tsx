"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  description: string;
  type: "bring" | "handle";
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ description: "", type: "bring" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add task");
      }

      const task = await res.json();
      setTasks([task, ...tasks]);
      setNewTask({ description: "", type: "bring" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const bringTasks = tasks.filter((t) => t.type === "bring");
  const handleTasks = tasks.filter((t) => t.type === "handle");

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold">
          📋 Party Contributions
        </h1>
        <p className="text-christmas-cream/70 mt-1">
          Let everyone know what you can bring or help with!
        </p>
      </div>

      {/* Add New Task */}
      <div className="christmas-card p-6 mb-8">
        <h2 className="text-xl font-bold text-christmas-gold mb-4">
          ➕ Add Your Contribution
        </h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-christmas-gold mb-2">
              What can you contribute?
            </label>
            <input
              type="text"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="e.g., Homemade cookies, DJ equipment, help with decorations..."
              className="input-christmas w-full"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-christmas-gold mb-2">
              Type of contribution
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="bring"
                  checked={newTask.type === "bring"}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as "bring" | "handle" })}
                  className="w-4 h-4"
                />
                <span className="text-christmas-cream">🎁 I can bring something</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="handle"
                  checked={newTask.type === "handle"}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as "bring" | "handle" })}
                  className="w-4 h-4"
                />
                <span className="text-christmas-cream">🛠️ I can help with something</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !newTask.description.trim()}
            className="btn-christmas"
          >
            {submitting ? "Adding..." : "Add Contribution"}
          </button>
        </form>
      </div>

      {/* Tasks Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Things to Bring */}
        <div className="christmas-card p-6">
          <h3 className="text-xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
            🎁 Things People Will Bring
          </h3>
          {bringTasks.length === 0 ? (
            <p className="text-christmas-cream/50 text-sm">
              No items yet. Be the first to contribute!
            </p>
          ) : (
            <ul className="space-y-3">
              {bringTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-2 bg-christmas-dark/50 rounded-lg p-3"
                >
                  <div>
                    <p className="text-christmas-cream">{task.description}</p>
                    <p className="text-xs text-christmas-cream/50 mt-1">
                      by {task.user.name}
                    </p>
                  </div>
                  {(task.user.id === session.user.id || session.user.isAdmin) && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Things to Handle */}
        <div className="christmas-card p-6">
          <h3 className="text-xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
            🛠️ Tasks People Will Handle
          </h3>
          {handleTasks.length === 0 ? (
            <p className="text-christmas-cream/50 text-sm">
              No tasks yet. Volunteer to help!
            </p>
          ) : (
            <ul className="space-y-3">
              {handleTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-2 bg-christmas-dark/50 rounded-lg p-3"
                >
                  <div>
                    <p className="text-christmas-cream">{task.description}</p>
                    <p className="text-xs text-christmas-cream/50 mt-1">
                      by {task.user.name}
                    </p>
                  </div>
                  {(task.user.id === session.user.id || session.user.isAdmin) && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

