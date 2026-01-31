import React, { useState, useEffect, useRef } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import api from "./api";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/hljs/csharp";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("csharp", csharp);

function App() {
  /* ---------------- AUTH ---------------- */
  const [isAuth, setIsAuth] = useState(
    !!localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
});

  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

   /* ---------------- THEME ---------------- */
   const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [theme]);

  /* ---------------- CHAT STATE ---------------- */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  const [isTyping, setIsTyping] = useState(false);

  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- LOAD THREADS ---------------- */
  const loadThreads = async () => {
    try {
      const res = await api.get("/api/threads");
      setThreads(res.data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  useEffect(() => {
    if (isAuth) {
      loadThreads();
    }
  }, [isAuth]);

  /* ---------------- CREATE NEW THREAD ---------------- */
  const createNewThread = async () => {
    const res = await api.post("/api/threads");

    setThreads((prev) => [res.data, ...prev]);
    setActiveThread(res.data);
    setMessages([]);
  };

  /* ---------------- DELETE THREAD ---------------- */
  const deleteThread = async (threadId) => {
    if (!window.confirm("Delete this chat?")) return;

    await api.delete(`/api/threads/${threadId}`);

    setThreads((prev) => prev.filter((t) => t._id !== threadId));

    if (activeThread?._id === threadId) {
      setActiveThread(null);
      setMessages([]);
    }
  };

  /* ---------------- LOAD SINGLE THREAD ---------------- */
  const loadThread = async (thread) => {
    try {
      const res = await api.get(`/api/threads/${thread._id}`);
      setActiveThread(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load thread:", err);
    }
  };

  /* ---------------- RENAME THREAD ---------------- */
  const saveThreadTitle = async (threadId) => {
    if (!editedTitle.trim()) return;

    await api.put(`/api/threads/${threadId}`, {
      title: editedTitle,
    });

    setThreads((prev) =>
      prev.map((t) =>
        t._id === threadId ? { ...t, title: editedTitle } : t
      )
    );

    setEditingThreadId(null);
  };

  /* ---------------- LANGUAGE MAP ---------------- */
  const mapLanguage = (lang) => {
    if (!lang || lang.toLowerCase() === "unknown") return "javascript";

    switch (lang.toLowerCase()) {
      case "python":
        return "python";
      case "javascript":
        return "javascript";
      case "java":
        return "java";
      case "c++":
        return "cpp";
      case "c#":
        return "csharp";
      default:
        return "javascript";
    }
  };

  /* ---------------- TYPING EFFECT ---------------- */
  const typeText = async (text) => {
    setIsTyping(true);

    for (let i = 1; i <= text.length; i++) {
      const partial = text.slice(0, i);

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: partial },
      ]);

      await new Promise((res) => setTimeout(res, 10));
    }

    setIsTyping(false);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!input.trim()) return;

    let thread = activeThread;

    // Create thread if none exists
    if (!thread) {
      const res = await api.post("/api/threads");
      thread = res.data;

      setActiveThread(thread);
      setThreads((prev) => [thread, ...prev]);
    }

    const userCode = input;
    setInput("");
    // Reset textarea height back to normal
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }


    // Show user + thinking
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userCode, language: "text" },
      { role: "assistant", content: "Thinking..." },
    ]);

    // Save user msg
    await api.post(`/api/threads/${thread._id}/messages`, {
      role: "user",
      content: userCode,
      language: "text",
    });

    try {
      // Explain
      const res = await api.post("/api/explain", {
        code: userCode,
      });

      const detectedLang = res.data.language;

      // Update language
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 2].language = detectedLang;
        return updated;
      });

      // Replace thinking
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "" },
      ]);

      await typeText(res.data.explanation);

      // Save assistant msg
      await api.post(`/api/threads/${thread._id}/messages`, {
        role: "assistant",
        content: res.data.explanation,
      });

      loadThreads();
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Error generating explanation." },
      ]);
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setIsAuth(false);
    setThreads([]);
    setMessages([]);
    setActiveThread(null);
  };

  /* ---------------- FORMAT EXPLANATION ---------------- */
  const formatExplanation = (text) => {
  return text.split("\n").map((line, i) => (
    <p
      key={i}
      className="
        mb-2
        leading-relaxed
        text-[var(--text)]
        break-words
        whitespace-pre-wrap
      "
    >
      {line}
    </p>
  ));
};

  /* ---------------- AUTH SCREENS ---------------- */
  if (!isAuth) {
    if (showForgot) {
      return <ForgotPassword
                switchToLogin={() => setShowForgot(false)}
                onAuth={() => {
                  setIsAuth(true);
                  setUser(JSON.parse(localStorage.getItem("user")));
                }}
              />

    }

    return showSignup ? (
      <Signup
        onAuth={() => {
          setIsAuth(true);
          setUser(JSON.parse(localStorage.getItem("user")));
        }}
        switchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <Login
        onAuth={() => {
          setIsAuth(true);
          setUser(JSON.parse(localStorage.getItem("user")));
        }}
        switchToSignup={() => setShowSignup(true)}
        switchToForgot={() => setShowForgot(true)}
      />
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
  <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
    
    {/* ✅ Sidebar Overlay (Mobile Only) */}
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={() => setIsSidebarOpen(false)}
      />
    )}

    {/* ✅ Sidebar */}
    <div
      className={`
        bg-[var(--sidebar)] border-r border-[var(--card)]
        transition-all duration-300
        flex flex-col

        /* Desktop: push layout */
        ${isSidebarOpen ? "w-64" : "w-0"}
        hidden md:flex overflow-hidden

        /* Mobile: overlay */
        fixed md:static top-0 left-0 z-50 h-full w-64
        transform md:transform-none
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* ✅ Close Button (Mobile Only) */}
      <div className="flex justify-between items-center mb-4 md:hidden">
        <h2 className="font-bold text-[var(--primary)]">Chats</h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search chats..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded bg-[var(--card)] text-sm"
      />

      {/* New Chat */}
      <button
        onClick={createNewThread}
        className="w-full bg-[var(--primary)] text-white mb-4 py-2 rounded font-semibold hover:bg-[var(--primary-dark)]"
      >
        + New Chat
      </button>

      {/* ✅ Threads Scroll */}
      <div className="overflow-y-auto h-[75vh] pr-1">
        {threads
          .filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase())
          )
          .map((t) => (
            <div key={t._id} className="mb-2">
              
              {/* ✅ Rename Mode */}
              {editingThreadId === t._id ? (
                <input
                  value={editedTitle}
                  autoFocus
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => saveThreadTitle(t._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveThreadTitle(t._id);
                    if (e.key === "Escape") setEditingThreadId(null);
                  }}
                  className="w-full bg-[var(--card)] text-[var(--text)] px-2 py-1 rounded"
                />
              ) : (
                <div
                  className="flex justify-between items-center p-2 rounded cursor-pointer hover:bg-[var(--card)]"
                  onClick={() => {
                    loadThread(t);

                    // ✅ Auto-close ONLY on mobile
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  onDoubleClick={() => {
                    setEditingThreadId(t._id);
                    setEditedTitle(t.title);
                  }}
                >
                  <span className="truncate">{t.title}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(t._id);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>

    {/* ✅ Main Chat Area */}
    <div className="flex-1 flex flex-col h-full">

      {/* ✅ Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--card)] shrink-0">

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen((p) => !p)}
          className="text-xl"
        >
          ☰
        </button>

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-[var(--primary)] font-bold text-base md:text-xl">
            CodeInsight
          </h1>

          {user && (
            <p className="text-xs text-[var(--primary-dark)]">
              Hello, {user.name} 
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="bg-[var(--primary)] text-white px-3 py-2 rounded text-xs"
          >
            {theme === "dark" ? "☀" : "🌙"}
          </button>

          <button
            onClick={handleLogout}
            className="bg-[var(--primary)] text-white px-3 py-1 rounded text-xs"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ✅ Messages Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="w-full">

            {/* User Code */}
            {msg.role === "user" ? (
              <div className="overflow-x-auto rounded-lg">
                <SyntaxHighlighter
                  language={mapLanguage(msg.language)}
                  style={theme === "dark" ? atomOneDark : atomOneLight}
                  showLineNumbers
                  customStyle={{
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "13px",
                    whiteSpace: "pre",
                  }}
                >
                  {msg.content}
                </SyntaxHighlighter>
              </div>
            ) : (
              /* Assistant Explanation */
              <div className="bg-[var(--card)] p-4 rounded-lg text-sm leading-relaxed">
                {formatExplanation(msg.content)}

                {isTyping && i === messages.length - 1 && (
                  <span className="animate-pulse ml-1">▍</span>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ✅ Input Fixed Bottom */}
      <div className="border-t border-[var(--card)] p-3 shrink-0">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            placeholder="Message CodeInsight..."
            rows={1}
            className="w-full bg-[var(--card)] p-4 rounded-lg resize-none focus:outline-none text-sm"
            onChange={(e) => {
              setInput(e.target.value);

              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            className="absolute right-3 bottom-3 bg-[var(--primary)] text-white w-9 h-9 rounded-full flex items-center justify-center"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

export default App;