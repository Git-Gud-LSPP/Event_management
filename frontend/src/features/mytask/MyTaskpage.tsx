import { useState } from "react";
import {
  List,
  LayoutGrid,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock3,
} from "lucide-react";

import { tasks } from "../schedule/data";
import type { Task } from "../schedule/data";

type ViewMode = "list" | "board";

type TaskGroup = "recent" | "today" | "next" | "later";

const taskGroups: Record<TaskGroup, number[]> = {
  recent: [4, 5, 7, 8],
  today: [2, 6, 9],
  next: [10, 1, 3],
  later: [],
};

const priorityById: Record<number, "High" | "Medium" | "Low"> = {
  1: "Medium",
  2: "High",
  3: "Medium",
  4: "High",
  5: "High",
  6: "Low",
  7: "High",
  8: "High",
  9: "High",
  10: "Medium",
};

const getTaskById = (id: number): Task | undefined => {
  return tasks.find((task) => task.id === id);
};

const getStatusClasses = (status: Task["status"]) => {
  switch (status) {
    case "Done":
      return "bg-emerald-50 text-emerald-600";

    case "In Progress":
      return "bg-indigo-50 text-indigo-600";

    case "Blocked":
      return "bg-red-50 text-red-500";

    case "Pending":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getPriorityClasses = (
  priority: "High" | "Medium" | "Low"
) => {
  switch (priority) {
    case "High":
      return "text-red-500";

    case "Medium":
      return "text-amber-500";

    case "Low":
      return "text-slate-500";

    default:
      return "text-slate-500";
  }
};

const Avatar = ({
  initials,
}: {
  initials: string;
}) => {
  return (
    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
      {initials}
    </div>
  );
};

const TaskCard = ({
  task,
  board = false,
  completed,
  onToggle,
}: {
  task: Task;
  board?: boolean;
  completed: boolean;
  onToggle: () => void;
}) => {
  const priority = priorityById[task.id];

  const isDone = completed;
  const isBlocked = task.status === "Blocked" && !completed;

  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm
        transition-all hover:shadow-md
        ${
          isBlocked
            ? "border-red-200"
            : "border-gray-200"
        }
        ${board ? "p-4" : "px-4 py-5"}
      `}
    >
      {/* TOP / TASK NAME */}
      {!board && (
  <button
    type="button"
    onClick={onToggle}
    className="pt-1 shrink-0 cursor-pointer"
    aria-label={
      isDone
        ? `Mark ${task.name} as incomplete`
        : `Mark ${task.name} as complete`
    }
  >
    {isDone ? (
      <CheckCircle2
        className="w-5 h-5 text-emerald-500"
        fill="currentColor"
      />
    ) : (
      <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500 transition-colors" />
    )}
  </button>
)}
    <div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <h3
              className={`
                text-sm font-medium
                ${
                  isDone
                    ? "text-gray-400 line-through"
                    : "text-slate-900"
                }
              `}
            >
              {task.name}
            </h3>

            {isBlocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-medium">
                <AlertCircle className="w-3 h-3" />
                Blocked
              </span>
            )}
          </div>

          {!board && (
            <p className="mt-1 text-xs text-slate-400">
              TechSummit 2026
            </p>
          )}

          {board && isBlocked && task.dependsOn && (
            <p className="mt-2 text-xs text-red-500 leading-4">
              <span className="font-medium">⊘</span>{" "}
              {task.dependsOn}
            </p>
          )}
        </div>

        {board && (
          <span
            className={`text-xs font-medium ${getPriorityClasses(
              priority
            )}`}
          >
            {priority === "High"
              ? "H"
              : priority === "Medium"
              ? "M"
              : "L"}
          </span>
        )}
      </div>

      {/* LIST VIEW DETAILS */}
      {!board && (
        <div className="mt-2 flex items-center justify-end gap-5">
          <div className="flex items-center gap-2">
            <Avatar initials={task.initials} />

            <span className="text-xs text-slate-500">
              {task.owner}
            </span>
          </div>

          <span
            className={`text-xs font-medium ${getPriorityClasses(
              priority
            )}`}
          >
            {priority}
          </span>

          <div className="flex items-center gap-1 text-xs text-slate-500 min-w-[55px]">
            <Clock3 className="w-3.5 h-3.5" />
            {task.start}
          </div>

          <span
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              ${getStatusClasses(task.status)}
            `}
          >
            {task.status}
          </span>
        </div>
      )}

      {/* BOARD VIEW DETAILS */}
      {board && (
        <div className="mt-3 flex items-center gap-2">
          <Avatar initials={task.initials} />

          <span className="text-xs text-slate-500">
            {task.start}
          </span>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  count,
}: {
  title: string;
  count: number;
}) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-sm font-semibold text-slate-900">
        {title}
      </h2>

      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold flex items-center justify-center">
        {count}
      </span>

      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
};

const BoardColumn = ({
  title,
  taskIds,
  background,
  completedTaskIds,
  toggleTask,
}: {
  title: string;
  taskIds: number[];
  background: string;
  completedTaskIds: number[];
  toggleTask: (taskId: number) => void;
}) => {
  return (
    <div
      className={`rounded-xl p-3 min-h-[430px] ${background}`}
    >
      <div className="flex items-center justify-between px-1 mb-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {title}
        </h2>

        <span className="w-6 h-6 rounded-full bg-white text-slate-500 text-xs font-medium flex items-center justify-center shadow-sm">
          {taskIds.length}
        </span>
      </div>

      <div className="space-y-3">
        {taskIds.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-slate-400">
            Nothing here
          </div>
        ) : (
          taskIds.map((id) => {
            const task = getTaskById(id);

            if (!task) return null;

            return (
              <TaskCard
                key={task.id}
                task={task}
                board
                completed={completedTaskIds.includes(task.id)}
                onToggle={() => toggleTask(task.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default function MyTasksPage() {
  const [viewMode, setViewMode] =
    useState<ViewMode>("list");

  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>(
    tasks
      .filter((task) => task.status === "Done")
      .map((task) => task.id)
  );

  const toggleTask = (taskId: number) => {
    setCompletedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const recentlyAssigned = taskGroups.recent
    .map(getTaskById)
    .filter(Boolean) as Task[];

  const doToday = taskGroups.today
    .map(getTaskById)
    .filter(Boolean) as Task[];

  const doNext = taskGroups.next
    .map(getTaskById)
    .filter(Boolean) as Task[];

  const doLater = taskGroups.later
    .map(getTaskById)
    .filter(Boolean) as Task[];

  const blockedCount = tasks.filter(
    (task) => task.status === "Blocked"
  ).length;

  return (
    <div className="min-h-full bg-[#FBFBF9]">

      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Tasks
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {tasks.length} tasks · {blockedCount} blocked
          </p>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              text-sm font-medium transition-all
              ${
                viewMode === "list"
                  ? "bg-[#002F2B] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            <List className="w-4 h-4" />
            List
          </button>

          <button
            onClick={() => setViewMode("board")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              text-sm font-medium transition-all
              ${
                viewMode === "board"
                  ? "bg-[#002F2B] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
        </div>
      </div>

      {/* ================= LIST VIEW ================= */}
      {viewMode === "list" && (
        <div className="space-y-8">

          {/* RECENTLY ASSIGNED */}
          <section>
            <SectionHeader
              title="Recently Assigned"
              count={recentlyAssigned.length}
            />

            <div className="space-y-2">
              {recentlyAssigned.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    completed={completedTaskIds.includes(task.id)}
                    onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </section>

          {/* DO TODAY */}
          <section>
            <SectionHeader
              title="Do Today"
              count={doToday.length}
            />

            <div className="space-y-2">
              {doToday.map((task) => (
                <TaskCard
                key={task.id}
                task={task}
                completed={completedTaskIds.includes(task.id)}
                onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </section>

          {/* DO NEXT */}
          <section>
            <SectionHeader
              title="Do Next"
              count={doNext.length}
            />

            <div className="space-y-2">
              {doNext.map((task) => (
                <TaskCard
                key={task.id}
                task={task}
                completed={completedTaskIds.includes(task.id)}
                onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </section>

          {/* DO LATER */}
          <section>
            <SectionHeader
              title="Do Later"
              count={doLater.length}
            />

            {doLater.length > 0 && (
              <div className="space-y-2">
                {doLater.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    completed={completedTaskIds.includes(task.id)}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================= BOARD VIEW ================= */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <BoardColumn
            title="Recently Assigned"
            taskIds={taskGroups.recent}
            background="bg-[#F8F8F8]"
            completedTaskIds={completedTaskIds}
            toggleTask={toggleTask}
            />

         <BoardColumn
            title="Do Today"
            taskIds={taskGroups.today}
            background="bg-[#DFF5F7]"
            completedTaskIds={completedTaskIds}
            toggleTask={toggleTask}
            />

         <BoardColumn
            title="Do Next"
            taskIds={taskGroups.next}
            background="bg-[#F5F8D9]"
            completedTaskIds={completedTaskIds}
            toggleTask={toggleTask}
            />
          <BoardColumn
            title="Do Later"
            taskIds={taskGroups.later}
            background="bg-[#E1E1FA]"
            completedTaskIds={completedTaskIds}
            toggleTask={toggleTask}
            />
        </div>
      )}
    </div>
  );
}