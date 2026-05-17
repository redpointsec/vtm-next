"use client";

import { useRef } from "react";
import type { NoteRecord, TaskRecord, UserOption } from "@/lib/crud";

type EditNoteDialogProps = {
  note: NoteRecord;
  tasks: TaskRecord[];
  users: UserOption[];
};

export function EditNoteDialog({ note, tasks, users }: EditNoteDialogProps) {
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

  const fieldId = (name: string) => `note-${note.id}-${name}`;

  return (
    <>
      <button type="button" className="button secondary compact" onClick={open}>
        Edit
      </button>
      <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdropClick}>
        <div className="dialog-header">
          <h2>Edit Note #{note.id}</h2>
          <button type="button" className="button secondary compact" onClick={close}>
            Close
          </button>
        </div>
        <div className="dialog-body">
          <form className="form-grid" action="/api/notes" method="post">
            <input name="id" type="hidden" defaultValue={note.id} />
            <div className="field">
              <label htmlFor={fieldId("taskId")}>Task</label>
              <select id={fieldId("taskId")} name="taskId" defaultValue={note.task_id}>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id} {task.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={fieldId("title")}>Title</label>
              <input id={fieldId("title")} name="title" defaultValue={note.title} />
            </div>
            <div className="field">
              <label htmlFor={fieldId("text")}>Description</label>
              <textarea id={fieldId("text")} name="text" defaultValue={note.text || ""} />
            </div>
            <div className="field">
              <label htmlFor={fieldId("image")}>Image URL/path</label>
              <input id={fieldId("image")} name="image" defaultValue={note.image || ""} />
            </div>
            <div className="field">
              <label htmlFor={fieldId("userId")}>Author</label>
              <select
                id={fieldId("userId")}
                name="userId"
                defaultValue={String(note.user_id || "")}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" type="submit">
              Save note
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
