import os
import sys
import json
import time
import subprocess
import tempfile
from typing import Dict, Any, List, Optional

def normalize_output(val: Any) -> str:
    """Normalize output for consistent comparison."""
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (list, dict)):
        try:
            return json.dumps(val, sort_keys=True)
        except Exception:
            return str(val)
    # If string, strip outer quotes or whitespace if JSON formatted
    val_str = str(val).strip()
    try:
        parsed = json.loads(val_str)
        return json.dumps(parsed, sort_keys=True)
    except Exception:
        return val_str

class ExecutionEngine:
    """
    Server-authoritative code execution engine.
    Safely executes user code against test cases with timeouts and output comparison.
    """
    def __init__(self, timeout_seconds: float = 4.0):
        self.timeout_seconds = timeout_seconds

    def execute(
        self,
        language: str,
        code: str,
        test_cases: List[Dict[str, Any]],
        entry_point: Optional[str] = None
    ) -> Dict[str, Any]:
        lang = language.lower()
        if lang in ["python", "python3", "py"]:
            return self._execute_python(code, test_cases, entry_point)
        elif lang in ["javascript", "js", "node"]:
            return self._execute_javascript(code, test_cases, entry_point)
        else:
            # Fallback for other languages: attempt python/js or standard evaluation
            return self._execute_python(code, test_cases, entry_point)

    def _execute_python(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        entry_point: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs Python code by wrapping it with a test runner harness.
        """
        # Runner script harness
        harness = f"""
import sys
import json
import time
import math
import collections
import heapq
import bisect
import itertools

# User code start
{code}
# User code end

# Test cases runner
test_cases = {json.dumps(test_cases)}

results = []
all_passed = True
total_runtime = 0.0

# Discover callable functions if entry_point is not specified
candidate_funcs = [v for k, v in list(locals().items()) if callable(v) and not k.startswith('_') and k not in ['json', 'sys', 'time', 'math', 'collections', 'heapq', 'bisect', 'itertools']]
target_func = None
if "{entry_point or ''}" and "{entry_point or ''}" in locals():
    target_func = locals()["{entry_point or ''}"]
elif candidate_funcs:
    target_func = candidate_funcs[-1]

for idx, tc in enumerate(test_cases):
    raw_input = tc.get("input", "")
    expected = tc.get("expectedOutput", "")
    case_result = {{
        "case_number": idx + 1,
        "input": str(raw_input),
        "expected_output": str(expected),
        "actual_output": "",
        "passed": False,
        "error": None,
        "runtime_ms": 0.0
    }}
    
    start_t = time.perf_counter()
    try:
        # Parse inputs
        args = []
        if isinstance(raw_input, list):
            args = raw_input
        elif isinstance(raw_input, dict):
            args = [raw_input]
        else:
            # Try parsing comma-separated inputs or json
            try:
                # E.g. "[2,7,11,15], 9" -> wrap in [] to make valid JSON tuple
                parsed = json.loads(f"[{{raw_input}}]")
                args = parsed
            except Exception:
                args = [raw_input]
        
        if target_func:
            output = target_func(*args)
        else:
            output = None

        elapsed_ms = (time.perf_counter() - start_t) * 1000
        case_result["runtime_ms"] = round(elapsed_ms, 2)
        total_runtime += elapsed_ms

        # Normalize comparison
        def norm(v):
            if v is None: return "null"
            if isinstance(v, bool): return "true" if v else "false"
            if isinstance(v, (int, float)): return str(v)
            if isinstance(v, (list, dict)):
                try: return json.dumps(v, sort_keys=True)
                except: return str(v)
            s = str(v).strip()
            try:
                p = json.loads(s)
                return json.dumps(p, sort_keys=True)
            except:
                return s

        norm_actual = norm(output)
        norm_exp = norm(expected)
        
        # Check equality
        passed = (norm_actual == norm_exp)
        if not passed and isinstance(output, (list, tuple)) and isinstance(expected, str):
            try:
                if list(output) == json.loads(expected):
                    passed = True
            except:
                pass
        
        case_result["actual_output"] = str(output) if output is not None else ""
        case_result["passed"] = passed
        if not passed:
            all_passed = False
            
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_t) * 1000
        case_result["runtime_ms"] = round(elapsed_ms, 2)
        case_result["error"] = f"{{type(e).__name__}}: {{str(e)}}"
        case_result["actual_output"] = f"Error: {{str(e)}}"
        case_result["passed"] = False
        all_passed = False
    
    results.append(case_result)

output_data = {{
    "all_passed": all_passed,
    "total_test_cases": len(test_cases),
    "passed_test_cases": sum(1 for r in results if r["passed"]),
    "total_runtime_ms": round(total_runtime, 2),
    "results": results
}}
print("---EXECUTION_OUTPUT_START---")
print(json.dumps(output_data))
print("---EXECUTION_OUTPUT_END---")
"""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
            f.write(harness)
            temp_path = f.name

        try:
            cmd = [sys.executable, temp_path]
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds
            )
            
            stdout = proc.stdout
            stderr = proc.stderr
            
            if proc.returncode != 0:
                # Syntax or fatal error
                error_msg = stderr.strip() or stdout.strip() or "Runtime error during execution"
                return {
                    "success": False,
                    "status": "Runtime Error",
                    "total_test_cases": len(test_cases),
                    "passed_test_cases": 0,
                    "runtime_ms": 0.0,
                    "error": error_msg,
                    "test_results": [
                        {
                            "case_number": i + 1,
                            "input": str(tc.get("input", "")),
                            "expected_output": str(tc.get("expectedOutput", "")),
                            "actual_output": "Error",
                            "passed": False,
                            "error": error_msg
                        }
                        for i, tc in enumerate(test_cases)
                    ]
                }
            
            # Parse result from stdout
            if "---EXECUTION_OUTPUT_START---" in stdout:
                parts = stdout.split("---EXECUTION_OUTPUT_START---")[1].split("---EXECUTION_OUTPUT_END---")[0].strip()
                data = json.loads(parts)
                all_passed = data["all_passed"]
                status = "Accepted" if all_passed else "Wrong Answer"
                return {
                    "success": all_passed,
                    "status": status,
                    "total_test_cases": data["total_test_cases"],
                    "passed_test_cases": data["passed_test_cases"],
                    "runtime_ms": data["total_runtime_ms"],
                    "test_results": data["results"]
                }
            else:
                return {
                    "success": False,
                    "status": "Execution Error",
                    "total_test_cases": len(test_cases),
                    "passed_test_cases": 0,
                    "runtime_ms": 0.0,
                    "error": stdout or stderr,
                    "test_results": []
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "status": "Time Limit Exceeded",
                "total_test_cases": len(test_cases),
                "passed_test_cases": 0,
                "runtime_ms": self.timeout_seconds * 1000,
                "error": f"Execution timed out ({self.timeout_seconds}s limit)",
                "test_results": []
            }
        except Exception as e:
            return {
                "success": False,
                "status": "Runtime Error",
                "total_test_cases": len(test_cases),
                "passed_test_cases": 0,
                "runtime_ms": 0.0,
                "error": str(e),
                "test_results": []
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def _execute_javascript(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        entry_point: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs JavaScript code using Node.js if available.
        """
        harness = f"""
{code}

const testCases = {json.dumps(test_cases)};
const results = [];
let allPassed = true;
let totalRuntime = 0;

// Find exported/defined function
let targetFunc = null;
const globalKeys = Object.keys(global);

// Find candidate function in local scope
const funcNames = [];
try {{
    const lines = {json.dumps(code.splitlines())};
    for (const l of lines) {{
        const m = l.match(/function\\s+([a-zA-Z0-9_$]+)/);
        if (m) funcNames.push(m[1]);
        const m2 = l.match(/(?:const|let|var)\\s+([a-zA-Z0-9_$]+)\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>)/);
        if (m2) funcNames.push(m2[1]);
    }}
}} catch(e) {{}}

for (const fn of funcNames) {{
    try {{
        if (typeof eval(fn) === 'function') {{
            targetFunc = eval(fn);
            break;
        }}
    }} catch(e) {{}}
}}

for (let i = 0; i < testCases.length; i++) {{
    const tc = testCases[i];
    const rawInput = tc.input;
    const expected = tc.expectedOutput;
    const caseResult = {{
        case_number: i + 1,
        input: String(rawInput),
        expected_output: String(expected),
        actual_output: "",
        passed: false,
        error: null,
        runtime_ms: 0.0
    }};

    const start = process.hrtime.bigint();
    try {{
        let args = [];
        try {{
            args = JSON.parse('[' + rawInput + ']');
        }} catch(e) {{
            args = [rawInput];
        }}

        let output = targetFunc ? targetFunc(...args) : undefined;
        const end = process.hrtime.bigint();
        const elapsedMs = Number(end - start) / 1e6;
        caseResult.runtime_ms = Math.round(elapsedMs * 100) / 100;
        totalRuntime += elapsedMs;

        const norm = (v) => {{
            if (v === null || v === undefined) return "null";
            if (typeof v === 'boolean') return v ? "true" : "false";
            if (typeof v === 'number') return String(v);
            if (typeof v === 'object') {{
                try {{ return JSON.stringify(v); }} catch(e) {{ return String(v); }}
            }}
            const s = String(v).trim();
            try {{ return JSON.stringify(JSON.parse(s)); }} catch(e) {{ return s; }}
        }};

        const normActual = norm(output);
        const normExp = norm(expected);
        const passed = (normActual === normExp);

        caseResult.actual_output = output !== undefined ? (typeof output === 'object' ? JSON.stringify(output) : String(output)) : "";
        caseResult.passed = passed;
        if (!passed) allPassed = false;
    }} catch(err) {{
        const end = process.hrtime.bigint();
        const elapsedMs = Number(end - start) / 1e6;
        caseResult.runtime_ms = Math.round(elapsedMs * 100) / 100;
        caseResult.error = err.message;
        caseResult.actual_output = "Error: " + err.message;
        caseResult.passed = false;
        allPassed = false;
    }}
    results.push(caseResult);
}}

const outputData = {{
    all_passed: allPassed,
    total_test_cases: testCases.length,
    passed_test_cases: results.filter(r => r.passed).length,
    total_runtime_ms: Math.round(totalRuntime * 100) / 100,
    results: results
}};

console.log("---EXECUTION_OUTPUT_START---");
console.log(JSON.stringify(outputData));
console.log("---EXECUTION_OUTPUT_END---");
"""
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(harness)
            temp_path = f.name

        try:
            proc = subprocess.run(
                ["node", temp_path],
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds
            )
            stdout = proc.stdout
            stderr = proc.stderr

            if proc.returncode != 0:
                error_msg = stderr.strip() or stdout.strip() or "JavaScript runtime error"
                return {
                    "success": False,
                    "status": "Runtime Error",
                    "total_test_cases": len(test_cases),
                    "passed_test_cases": 0,
                    "runtime_ms": 0.0,
                    "error": error_msg,
                    "test_results": []
                }

            if "---EXECUTION_OUTPUT_START---" in stdout:
                parts = stdout.split("---EXECUTION_OUTPUT_START---")[1].split("---EXECUTION_OUTPUT_END---")[0].strip()
                data = json.loads(parts)
                all_passed = data["all_passed"]
                status = "Accepted" if all_passed else "Wrong Answer"
                return {
                    "success": all_passed,
                    "status": status,
                    "total_test_cases": data["total_test_cases"],
                    "passed_test_cases": data["passed_test_cases"],
                    "runtime_ms": data["total_runtime_ms"],
                    "test_results": data["results"]
                }
            else:
                return {
                    "success": False,
                    "status": "Execution Error",
                    "total_test_cases": len(test_cases),
                    "passed_test_cases": 0,
                    "runtime_ms": 0.0,
                    "error": stdout or stderr,
                    "test_results": []
                }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "status": "Time Limit Exceeded",
                "total_test_cases": len(test_cases),
                "passed_test_cases": 0,
                "runtime_ms": self.timeout_seconds * 1000,
                "error": f"Execution timed out ({self.timeout_seconds}s limit)",
                "test_results": []
            }
        except Exception as e:
            return {
                "success": False,
                "status": "Runtime Error",
                "total_test_cases": len(test_cases),
                "passed_test_cases": 0,
                "runtime_ms": 0.0,
                "error": str(e),
                "test_results": []
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

execution_engine = ExecutionEngine()
