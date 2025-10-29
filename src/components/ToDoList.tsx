import React, { useState, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ToDoItem } from "./ToDoItem";
import { type ToDo, type RemoteDragState } from "../App";

interface ToDoListProps {
  todos: ToDo[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  remoteDragState: RemoteDragState | null;
}

export const ToDoList: React.FC<ToDoListProps> = ({
  todos,
  onToggleComplete,
  onDelete,
  remoteDragState,
}) => {
  const [ghostStyle, setGhostStyle] = useState({});

  const ghostItem = remoteDragState
    ? todos.find((t) => t.id === remoteDragState.itemId)
    : null;

  useEffect(() => {
    if (remoteDragState && remoteDragState.overId) {
      const overEl = document.querySelector(
        `[data-rbd-draggable-id="${remoteDragState.overId}"]`
      );
      if (overEl) {
        const rect = overEl.getBoundingClientRect();
        setGhostStyle({
          position: "fixed",
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          transition: "top 0.15s ease-out",
        });
      }
    }
  }, [remoteDragState]);

  return (
    <div className="todo-list">
      <SortableContext
        items={todos.map((todo) => todo.id)}
        strategy={verticalListSortingStrategy}
      >
        {todos.map((todo) => (
          <ToDoItem
            key={todo.id}
            todo={todo}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            isGhost={ghostItem?.id === todo.id}
          />
        ))}
      </SortableContext>

      {ghostItem && (
        <div style={ghostStyle} className="ghost-item">
          <ToDoItem
            todo={ghostItem}
            onToggleComplete={() => {}}
            onDelete={() => {}}
            isGhost={false}
          />
        </div>
      )}
    </div>
  );
};
