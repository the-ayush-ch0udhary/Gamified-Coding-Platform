"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2, RotateCcw, Copy, Check, Terminal, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamic import of Monaco Editor with SSR disabled
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-mono">Loading Code Editor...</span>
      </div>
    </div>
  ),
});

interface MonacoCodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  onReset?: () => void;
  readOnly?: boolean;
  height?: string;
}

export function MonacoCodeEditor({
  code,
  onChange,
  language = "python",
  onLanguageChange,
  onReset,
  readOnly = false,
  height = "100%",
}: MonacoCodeEditorProps) {
  const [fontSize, setFontSize] = useState<number>(14);
  const [copied, setCopied] = useState<boolean>(false);
  const [monacoLang, setMonacoLang] = useState<string>("python");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const map: { [key: string]: string } = {
      python: "python",
      javascript: "javascript",
      js: "javascript",
      cpp: "cpp",
      c: "cpp",
      java: "java",
    };
    setMonacoLang(map[language.toLowerCase()] || "python");
  }, [language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const editorTheme = resolvedTheme === "light" ? "vs" : "vs-dark";

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Code Editor</span>
          </div>

          {onLanguageChange && (
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-7 w-[120px] bg-background border-border text-xs">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="python">Python 3</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="cpp">C++ 17</SelectItem>
                <SelectItem value="java">Java 11</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Font Size Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                <Settings2 className="h-3.5 w-3.5 mr-1" />
                <span>{fontSize}px</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border text-xs">
              {[12, 14, 16, 18].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setFontSize(size)}
                  className="cursor-pointer"
                >
                  {size}px {size === fontSize && "✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>

          {/* Reset Button */}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onReset}
              title="Reset to Starter Code"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full min-h-[300px] overflow-hidden bg-card">
        <Editor
          height={height}
          language={monacoLang}
          value={code}
          theme={editorTheme}
          onChange={(val) => onChange(val || "")}
          options={{
            fontSize: fontSize,
            fontFamily: "'JetBrains Mono', 'Source Code Pro', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            readOnly: readOnly,
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
