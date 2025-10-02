"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Mic,
  StopCircle,
  Activity,
  Settings,
  Menu,
  Bot,
  User,
  Heart,
  Brain,
  Shield,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  // const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = [
    { icon: Heart, text: "Como posso melhorar minha saúde cardiovascular?" },
    { icon: Brain, text: "Dicas para reduzir o estresse e ansiedade" },
    { icon: Shield, text: "Quais vitaminas são essenciais para imunidade?" },
    { icon: Sparkles, text: "Crie um plano de exercícios personalizado" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "⚠️ Ocorreu um erro ao se conectar com o servidor.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 shadow-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-teal-500">
                  HealthChat
                </h1>
                <p className="text-xs text-gray-500">
                  Seu assistente de saúde inteligente
                </p>
              </div>
            </div>
          </div>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 ? (
              /* Welcome Message */
              <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="max-w-2xl text-center px-4">
                  <div className="mb-8">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 shadow-lg mb-4">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-teal-500 mb-2">
                      Bem-vindo ao HealthChat
                    </h2>
                    <p className="text-gray-600">
                      Seu assistente pessoal de saúde e bem-estar, disponível
                      24/7
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md hover:border-teal-400 hover:bg-teal-50"
                      >
                        <suggestion.icon className="h-5 w-5 text-teal-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {suggestion.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-fade-in ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isUser
                            ? "bg-teal-400 text-white"
                            : "bg-gradient-to-br from-cyan-400 to-teal-400 text-white"
                        }`}
                      >
                        {isUser ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`flex max-w-[70%] flex-col gap-1 ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isUser
                              ? "bg-teal-400 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 px-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 text-white">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1 rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
                      <span
                        className="h-2 w-2 animate-pulse-soft rounded-full bg-gray-400"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-pulse-soft rounded-full bg-gray-400"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-pulse-soft rounded-full bg-gray-400"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 bg-white p-4"
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2">
            {/* <button
              type="button"
              className="shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button> */}

            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isTyping}
                className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[48px] max-h-[120px]"
                rows={1}
              />

              {/* <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className="absolute bottom-1.5 right-1.5 h-8 w-8 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isRecording ? (
                  <StopCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button> */}
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="shrink-0 h-10 w-10 rounded-full cursor-pointer bg-gradient-to-r from-teal-400 to-cyan-400 hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-white "
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-gray-500">
            HealthChat 1.0
          </p>
        </div>
      </form>
    </div>
  );
};

export default Index;
