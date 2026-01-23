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
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

  const [user, setUser] = useState(
  JSON.parse(localStorage.getItem("user"))
);

  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  /* ---------------- CHAT STATE ---------------- */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  const [isTyping, setIsTyping] = useState(false);

  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);

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
      <p key={i} className="text-slate-300 mb-2 leading-relaxed">
        {line}
      </p>
    ));
  };

  /* ---------------- AUTH SCREENS ---------------- */
  if (!isAuth) {
    if (showForgot) {
      return <ForgotPassword switchToLogin={() => setShowForgot(false)} />;
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
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 bg-slate-950 p-4 border-r border-slate-800">
          <input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded bg-slate-800 text-white text-sm"
          />

          <button
            onClick={createNewThread}
            className="w-full bg-cyan-500 mb-4 py-2 rounded font-semibold"
          >
            + New Chat
          </button>

          {threads
            .filter((t) =>
              t.title.toLowerCase().includes(search.toLowerCase())
            )
            .map((t) => (
              <div key={t._id} className="mb-2">
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
                    className="w-full bg-slate-800 text-white px-2 py-1 rounded"
                  />
                ) : (
                  <div
                    className="flex justify-between items-center p-2 rounded cursor-pointer hover:bg-slate-800 text-slate-300"
                    onClick={() => loadThread(t)}
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
      )}

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between border-b border-slate-700">
          <button
            onClick={() => setIsSidebarOpen((p) => !p)}
            className="text-white text-xl"
          >
            ☰
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-cyan-400 text-xl font-bold">
              CodeInsight — Code Explainer
            </h1>

            {user && (
              <p className="text-slate-400 text-sm">
                Hello, {user.name}
              </p>
            )}
          </div>


          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((msg, i) => (
            <div key={i} className="mb-4">
              {msg.role === "user" ? (
                <SyntaxHighlighter
                  language={mapLanguage(msg.language)}
                  style={atomOneDark}
                  showLineNumbers
                >
                  {msg.content}
                </SyntaxHighlighter>
              ) : (
                <div className="bg-slate-800 p-4 rounded-lg">
                  {formatExplanation(msg.content)}
                  {isTyping && <span className="animate-pulse">▍</span>}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700">
          <div className="relative w-full">
            {/* Expanding Textarea */}
            <textarea
              value={input}
              placeholder="Paste your code here..."
              rows={1}
              className="w-full bg-slate-800 text-white p-3 pr-16 rounded-lg resize-none focus:outline-none overflow-hidden"
              style={{ maxHeight: "200px" }}
              onChange={(e) => {
                setInput(e.target.value);

                // Auto-expand
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

            {/* Send Button INSIDE */}
            <button
              onClick={handleSend}
              className="absolute bottom-2 right-2 bg-cyan-500 px-4 py-2 rounded-lg font-semibold hover:bg-cyan-400"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
