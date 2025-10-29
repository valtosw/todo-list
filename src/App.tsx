import React, { useState, useEffect, useRef, useCallback } from "react";
import { ToDoList } from "./components/ToDoList";
import { database } from "./firebase";
import { ref, onValue, set, remove } from "firebase/database";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import throttle from "lodash.throttle";

const sessionId = Math.random().toString(36).substring(2, 9);

export interface ToDo {
  id: string;
  text: string;
  completed: boolean;
}

export interface RemoteDragState {
  itemId: string;
  overId: string | null;
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isSyncing, setIsSyncing] = useState(true);
  const [remoteDragState, setRemoteDragState] =
    useState<RemoteDragState | null>(null);

  const todosRef = useRef(ref(database, "todos")).current;
  const draggingRef = useRef(ref(database, "dragging")).current;

  useEffect(() => {
    const unsubscribeTodos = onValue(todosRef, (snapshot) => {
      setTodos(snapshot.val() || []);
      if (isSyncing) setIsSyncing(false);
    });

    const unsubscribeDragging = onValue(draggingRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sessionId !== sessionId) {
        setRemoteDragState({ itemId: data.itemId, overId: data.overId });
      } else {
        setRemoteDragState(null);
      }
    });

    return () => {
      unsubscribeTodos();
      unsubscribeDragging();
      remove(draggingRef);
    };
  }, [todosRef, draggingRef, isSyncing]);

  const updateTodosInFirebase = (newTodos: ToDo[]) => set(todosRef, newTodos);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledUpdateDrag = useCallback(
    throttle((itemId: string, overId: string | null) => {
      set(draggingRef, { itemId, overId, sessionId });
    }, 100),
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    set(draggingRef, { itemId: active.id, overId: null, sessionId });
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    throttledUpdateDrag(active.id as string, over?.id as string | null);
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

  const handleAddTodo = () => {
    if (newTodo.trim() === "") return;
    const newTodoItem: ToDo = {
      id: `todo-${Date.now()}`,
      text: newTodo,
      completed: false,
    };
    updateTodosInFirebase(todos ? [...todos, newTodoItem] : [newTodoItem]);
    setNewTodo("");
  };

  const handleToggleComplete = (todoId: string) => {
    const newTodos = todos.map((t) =>
      t.id === todoId ? { ...t, completed: !t.completed } : t
    );
    updateTodosInFirebase(newTodos);
  };

  const handleDeleteTodo = (todoId: string) => {
    const newTodos = todos.filter((t) => t.id !== todoId);
    updateTodosInFirebase(newTodos);
  };

  if (isSyncing) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <h1>Real-Time To-Do List</h1>
      <div className="input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <ToDoList
          todos={todos}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTodo}
          remoteDragState={remoteDragState}
        />
      </DndContext>
    </div>
  );
};

export default App;
