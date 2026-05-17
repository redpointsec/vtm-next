"use client";

import { useRef } from "react";
import type { TaskRecord, UserOption } from "@/lib/crud";

type Project = { id: number; title: string };

type EditTaskDialogProps = {
  task: TaskRecord;
  projects: Project[];
  users: UserOption[];
};

export function EditTaskDialog({ task, projects, users }: EditTaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      close();
    }
  }

  const fieldId = (name: string) => `task-${task.id}-${name}`;
  const assignedIds = (task.user_ids || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <>
      <button type="button" className="button secondary compact" onClick={open}>
        Edit
      </button>
      <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdropClick}>
        <div className="dialog-header">
          <h2>Edit Task #{task.id}</h2>
          <button type="button" className="button secondary compact" onClick={close}>
            Close
          </button>
        </div>
        <div className="dialog-body">
          <form className="form-grid" action="/api/tasks" method="post">
            <input name="id" type="hidden" defaultValue={task.id} />
            <div className="field">
              <label htmlFor={fieldId("projectId")}>Project</label>
              <select id={fieldId("projectId")} name="projectId" defaultValue={task.project_id}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={fieldId("title")}>Title</label>
              <input id={fieldId("title")} name="title" defaultValue={task.title} />
            </div>
            <div className="field">
              <label htmlFor={fieldId("text")}>Description</label>
              <textarea id={fieldId("text")} name="text" defaultValue={task.text || ""} />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor={fieldId("status")}>Status</label>
                <input id={fieldId("status")} name="status" defaultValue={task.status || "open"} />
              </div>
              <div className="field">
                <label htmlFor={fieldId("priority")}>Priority</label>
                <input
                  id={fieldId("priority")}
                  name="priority"
                  type="number"
                  defaultValue={task.priority || 2}
                />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor={fieldId("dueDate")}>Due date</label>
                <input
                  id={fieldId("dueDate")}
                  name="dueDate"
                  type="date"
                  defaultValue={task.due_date || ""}
                />
              </div>
              <div className="field">
                <label htmlFor={fieldId("completed")}>Completed</label>
                <select
                  id={fieldId("completed")}
                  name="completed"
                  defaultValue={String(task.completed || 0)}
                >
                  <option value="0">Open</option>
                  <option value="1">Done</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor={fieldId("userIds")}>Assigned to</label>
              <select
                id={fieldId("userIds")}
                name="userIds"
                multiple
                defaultValue={assignedIds}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
              <p className="field-hint">Hold Cmd (macOS) or Ctrl to select multiple.</p>
            </div>
            <button className="button" type="submit">
              Save task
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
