import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ToDo } from '../App';

interface ToDoItemProps {
  todo: ToDo;
}

export const ToDoItem: React.FC<ToDoItemProps> = ({ todo }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 4px 15px rgba(0, 0, 0, 0.15)' : 'none',
    zIndex: isDragging ? 1 : 0,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="todo-item-container">
      <div className="todo-item">{todo.text}</div>
    </div>
  );
};