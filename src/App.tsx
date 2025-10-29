import React, { useState, useEffect } from 'react';
import { ToDoList } from './components/ToDoList';
import { database } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export interface ToDo {
  id: string;
  text: string;
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const todosRef = ref(database, 'todos');
    onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTodos(data);
      }
      setIsSyncing(false);
    });
  }, []);

  const updateTodosInFirebase = (newTodos: ToDo[]) => {
    set(ref(database, 'todos'), newTodos);
  };

  const handleAddTodo = () => {
    if (newTodo.trim() === '') return;
    const newTodos = [...todos, { id: `todo-${Date.now()}`, text: newTodo }];
    updateTodosInFirebase(newTodos);
    setNewTodo('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        updateTodosInFirebase(reorderedItems);
        return reorderedItems;
      });
    }
  };

  if (isSyncing) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-container">
      <h1>Real-Time To-Do List</h1>
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
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <ToDoList todos={todos} />
      </DndContext>
    </div>
  );
};

export default App;