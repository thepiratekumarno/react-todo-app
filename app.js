const { useState, useEffect, useContext, createContext } = React;

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('todoApp_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('todoApp_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// AddTodo Component
const AddTodo = ({ onAddTodo }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      onAddTodo(trimmedValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Add a new todo..."
        className="add-todo-input"
        maxLength={100}
      />
      <button 
        type="submit" 
        className="add-todo-btn"
        disabled={!inputValue.trim()}
      >
        Add
      </button>
    </form>
  );
};

// TodoItem Component
const TodoItem = ({ todo, onToggleTodo, onDeleteTodo, onEditTodo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.text);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleEdit = () => {
    if (isEditing) {
      const trimmedValue = editValue.trim();
      if (trimmedValue && trimmedValue !== todo.text) {
        onEditTodo(todo.id, trimmedValue);
      } else {
        setEditValue(todo.text);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDeleteTodo(todo.id);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditValue(todo.text);
      setIsEditing(false);
    }
  };

  const handleTextClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isRemoving ? 'removing' : ''}`}>
      <div 
        className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
        onClick={() => onToggleTodo(todo.id)}
        role="checkbox"
        aria-checked={todo.completed}
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onToggleTodo(todo.id)}
      >
        {todo.completed && '✓'}
      </div>
      
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEdit}
          onKeyPress={handleKeyPress}
          className="todo-text editing"
          autoFocus
          maxLength={100}
        />
      ) : (
        <div 
          className="todo-text"
          onClick={handleTextClick}
          title="Click to edit"
        >
          {todo.text}
        </div>
      )}
      
      <div className="todo-actions">
        <button 
          className="todo-action-btn edit"
          onClick={handleEdit}
          title={isEditing ? "Save" : "Edit"}
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
        <button 
          className="todo-action-btn delete"
          onClick={handleDelete}
          title="Delete todo"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// TodoList Component
const TodoList = ({ todos, filter, onToggleTodo, onDeleteTodo, onEditTodo }) => {
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'completed':
        return todo.completed;
      case 'pending':
        return !todo.completed;
      default:
        return true;
    }
  });

  if (filteredTodos.length === 0) {
    const emptyMessages = {
      all: "No todos yet. Add one above to get started!",
      completed: "No completed todos yet.",
      pending: "No pending todos. Great job!"
    };

    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">
          {filter === 'all' ? 'Your todo list is empty' : `No ${filter} todos`}
        </div>
        <div className="empty-state-subtext">
          {emptyMessages[filter]}
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {filteredTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleTodo={onToggleTodo}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
        />
      ))}
    </div>
  );
};

// Main App Component
const App = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todoApp_todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todoApp_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now() + Math.random(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos(prevTodos => [newTodo, ...prevTodos]);
  };

  const toggleTodo = (id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const editTodo = (id, newText) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };

  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  return (
    <div className="todo-app">
      <div className="todo-container">
        <header className="todo-header">
          <h1 className="todo-title">React Todo App</h1>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className="todo-stats">
            <div className="stat-item">
              Total: <strong>{totalTodos}</strong>
            </div>
            <div className="stat-item">
              Completed: <strong>{completedTodos}</strong>
            </div>
            <div className="stat-item">
              Pending: <strong>{pendingTodos}</strong>
            </div>
          </div>
        </header>

        <div className="todo-body">
          <AddTodo onAddTodo={addTodo} />
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({totalTodos})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingTodos})
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedTodos})
            </button>
          </div>

          <TodoList
            todos={todos}
            filter={filter}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onEditTodo={editTodo}
          />
        </div>
      </div>
    </div>
  );
};

// Root App with Theme Provider
const AppWithProvider = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

// Render the app
ReactDOM.render(<AppWithProvider />, document.getElementById('root'));