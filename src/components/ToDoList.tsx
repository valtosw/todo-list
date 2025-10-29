import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ToDoItem } from './ToDoItem';
import type { ToDo } from '../App';

interface ToDoListProps {
  todos: ToDo[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  remoteDraggingId: string | null;
}

export const ToDoList: React.FC<ToDoListProps> = ({ todos, onToggleComplete, onDelete, remoteDraggingId }) => {
  return (
    <div className="todo-list">
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        {todos.map((todo) => (
          <ToDoItem
            key={todo.id}
            todo={todo}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            isRemoteDragging={remoteDraggingId === todo.id}
          />
        ))}
      </SortableContext>
    </div>
  );
};