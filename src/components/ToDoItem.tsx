import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ToDo } from '../App';

interface ToDoItemProps {
  todo: ToDo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isRemoteDragging: boolean;
}

export const ToDoItem: React.FC<ToDoItemProps> = ({ todo, onToggleComplete, onDelete, isRemoteDragging }) => {
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
  };

  const containerClasses = [
    'todo-item-container',
    isDragging ? 'dragging' : '',
    isRemoteDragging ? 'remote-dragging' : '',
    todo.completed ? 'completed' : ''
  ].join(' ').trim();

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
      <div className="drag-handle" {...attributes} {...listeners}>
        ⠿
      </div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="todo-checkbox"
      />
      <span className="todo-text">{todo.text}</span>
      <button onClick={() => onDelete(todo.id)} className="delete-button">
        ×
      </button>
    </div>
  );
};