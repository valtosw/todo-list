import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ToDoItem } from './ToDoItem';
import type { ToDo } from '../App';

interface ToDoListProps {
  todos: ToDo[];
}

export const ToDoList: React.FC<ToDoListProps> = ({ todos }) => {
  return (
    <div className="todo-list">
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        {todos.map((todo) => (
          <ToDoItem key={todo.id} todo={todo} />
        ))}
      </SortableContext>
    </div>
  );
};