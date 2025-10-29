import React, { useState, useEffect } from 'react';
import { ToDoList } from './components/ToDoList';
import { database } from './firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export interface ToDo {
  id: string;
  text: string;
  completed: boolean;
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);
  const [currentlyDraggingId, setCurrentlyDraggingId] = useState<string | null>(null);

  const todosRef = ref(database, 'todos');
  const draggingRef = ref(database, 'dragging');

  useEffect(() => {
    onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      setTodos(data ? data : []);
      setIsSyncing(false);
    });

    onValue(draggingRef, (snapshot) => {
      setCurrentlyDraggingId(snapshot.val()?.itemId || null);
    });

    return () => {
      remove(draggingRef);
    };
  }, [draggingRef, todosRef]);

  const updateTodosInFirebase = (newTodos: ToDo[]) => {
    set(todosRef, newTodos);
  };

  const handleAddTodo = () => {
    if (newTodo.trim() === '') return;
    const newTodoItem: ToDo = { id: `todo-${Date.now()}`, text: newTodo, completed: false };
    const newTodos = todos ? [...todos, newTodoItem] : [newTodoItem];
    updateTodosInFirebase(newTodos);
    setNewTodo('');
  };

  const handleToggleComplete = (todoId: string) => {
    const newTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    updateTodosInFirebase(newTodos);
  };

  const handleDeleteTodo = (todoId: string) => {
    const newTodos = todos.filter(todo => todo.id !== todoId);
    updateTodosInFirebase(newTodos);
  };

  const handleDragStart = (event: DragStartEvent) => {
    set(draggingRef, { itemId: event.active.id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    remove(draggingRef);

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((item) => item.id === active.id);
      const newIndex = todos.findIndex((item) => item.id === over.id);
      const reorderedItems = arrayMove(todos, oldIndex, newIndex);
      setTodos(reorderedItems);
      updateTodosInFirebase(reorderedItems);
    }
  };

  if (isSyncing) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-container">
      <h1>To-Do List</h1>
      <div className="input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ToDoList
          todos={todos}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTodo}
          remoteDraggingId={currentlyDraggingId}
        />
      </DndContext>
    </div>
  );
};

export default App;