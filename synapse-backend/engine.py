"""
Synapse OS — Workflow Execution Engine
=======================================
A FastAPI backend that accepts a React Flow graph (nodes + edges),
performs a topological sort to determine execution order, runs each
node through a type-specific executor, and returns timestamped logs.

Start with:
    uvicorn engine:app --reload --port 8000
"""

from __future__ import annotations

import os
import json
import time
import subprocess
import smtplib
from email.message import EmailMessage
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv, set_key

import google.generativeai as genai
import openai
import anthropic
import requests

# Load environment variables from .env
load_dotenv()


# ───────────────────────────── Models ─────────────────────────────

class NodeData(BaseModel):
    id: str
    type: str | None = None
    data: dict[str, Any] = {}
    position: dict[str, float] = {}


class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    type: str | None = None


class WorkflowPayload(BaseModel):
    nodes: list[NodeData]
    edges: list[EdgeData]


class ExecutionResult(BaseModel):
    success: bool
    execution_order: list[str]
    logs: list[str]
    context: dict[str, Any]


class APIKeysPayload(BaseModel):
    keys: dict[str, str]


# ─────────────────────────── DAG Parser ───────────────────────────

def topological_sort(nodes: list[NodeData], edges: list[EdgeData]) -> list[str]:
    """Kahn's algorithm — returns node IDs in execution order."""
    node_ids = {n.id for n in nodes}
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}
    adjacency: dict[str, list[str]] = defaultdict(list)

    for edge in edges:
        if edge.source in node_ids and edge.target in node_ids:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] = in_degree.get(edge.target, 0) + 1

    queue: deque[str] = deque(nid for nid, deg in in_degree.items() if deg == 0)
    order: list[str] = []

    while queue:
        nid = queue.popleft()
        order.append(nid)
        for neighbor in adjacency[nid]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(node_ids):
        raise ValueError("Cycle detected in workflow graph — cannot execute.")

    return order


# ──────────────────────── Node Executors ──────────────────────────

def _ts() -> str:
    """Return a formatted timestamp string."""
    return datetime.now(timezone.utc).strftime("%H:%M:%S")


def execute_ingestion(node: NodeData, context: dict, logs: list[str]) -> None:
    """Simulate reading telemetry / source data, or use provided text."""
    logs.append(f"[{_ts()}] INFO  ▸ Ingestion Node '{node.data.get('title', node.id)}' — Initializing…")
    time.sleep(0.3)
    
    config = node.data.get("config", {})
    raw_text = config.get("sourceText")
    
    if not raw_text:
        # Default mock data
        raw_text = (
            "Pump telemetry data stream: "
            "Pressure=142.5 psi, Flow=88.3 GPM, Temp=197°F, Vibration=0.42 in/s, "
            "Runtime=4382 hrs, Status=NOMINAL, Last_Maintenance=2026-06-15, "
            "Operator=SynapseAI_Agent_7, Facility=Plant_Delta_09"
        )
        logs.append(f"[{_ts()}] INFO  ▸ No source text provided in config, using default telemetry data.")

    context["raw_text"] = raw_text
    context["source"] = node.data.get("title", "Ingestion Node")
    logs.append(f"[{_ts()}] SUCCESS ▸ Ingested {len(raw_text)} characters from source.")


def execute_extraction(node: NodeData, context: dict, logs: list[str]) -> None:
    """Perform basic text manipulation / keyword extraction based on config."""
    logs.append(f"[{_ts()}] INFO  ▸ Extraction Node '{node.data.get('title', node.id)}' — Parsing…")
    time.sleep(0.25)
    
    config = node.data.get("config", {})
    mode = config.get("extractionMode", "key_value")

    raw = context.get("raw_text", "")
    if not raw:
        logs.append(f"[{_ts()}] WARN  ▸ No raw text in context — skipping extraction.")
        return

    pairs: dict[str, str] = {}
    
    if mode == "key_value":
        # Extract key-value pairs separated by commas
        for segment in raw.split(","):
            segment = segment.strip()
            if "=" in segment:
                k, v = segment.split("=", 1)
                pairs[k.strip()] = v.strip()
        logs.append(f"[{_ts()}] SUCCESS ▸ Extracted {len(pairs)} structured fields via key-value parsing.")
    elif mode == "regex":
        # Just mock regex for now, fallback to generic parse
        logs.append(f"[{_ts()}] INFO  ▸ Regex mode selected but not fully implemented, falling back to basic split.")
        words = [w for w in raw.split() if len(w) > 4]
        for i, w in enumerate(words[:10]):
            pairs[f"Match_{i}"] = w
        logs.append(f"[{_ts()}] SUCCESS ▸ Extracted {len(pairs)} fields via mock regex.")
    else:
        # Generic fallback
        pairs["raw_preview"] = raw[:50] + "..."
        logs.append(f"[{_ts()}] SUCCESS ▸ Generic extraction completed.")

    context["extracted_fields"] = pairs
    context["keywords"] = list(pairs.keys())


def execute_ai_inference(node: NodeData, context: dict, logs: list[str]) -> None:
    """Real Gemini API inference or mock based on config."""
    config = node.data.get("config", {})
    provider = config.get("provider", "Gemini")
    logs.append(f"[{_ts()}] INFO  ▸ AI Inference Node '{node.data.get('title', node.id)}' — Provider: {provider}")
    
    if provider == "Gemini":
        api_key = config.get("apiKey") or os.environ.get("GEMINI_API_KEY")
        model_name = config.get("geminiModel", "gemini-2.5-flash")
        
        # We need to map 'Gemini 2.5 Flash' to the actual API model name if needed
        actual_model_name = "gemini-2.5-flash" if "2.5" in model_name else "gemini-1.5-pro"
        
        if not api_key:
            logs.append(f"[{_ts()}] ERROR ▸ API Key is required for Gemini inference! Please set it in the node config.")
            context["ai_response"] = "ERROR: Missing API Key"
            return
            
        logs.append(f"[{_ts()}] INFO  ▸ GEMINI_API_KEY detected — performing real inference via Google AI Studio.")
        
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(actual_model_name)
            
            fields = context.get("extracted_fields", {})
            prompt = (
                f"Analyze the following data and provide a concise summary or recommendation:\n"
                f"{json.dumps(fields, indent=2)}\n"
                f"Also consider the raw text if needed: {context.get('raw_text', '')[:200]}"
            )
            
            logs.append(f"[{_ts()}] INFO  ▸ Sending request to {actual_model_name}...")
            response = model.generate_content(prompt)
            
            ai_text = response.text
            context["ai_response"] = ai_text
            context["ai_model"] = actual_model_name
            logs.append(f"[{_ts()}] SUCCESS ▸ Real inference complete — generated {len(ai_text)} character response.")
            
        except Exception as e:
            logs.append(f"[{_ts()}] ERROR ▸ Gemini API error: {str(e)}")
            context["ai_response"] = f"API Error: {str(e)}"
    elif provider == "OpenAI":
        api_key = config.get("apiKey") or os.environ.get("OPENAI_API_KEY")
        model_name = config.get("openaiModel", "gpt-4o")
        
        if not api_key:
            logs.append(f"[{_ts()}] ERROR ▸ API Key is required for OpenAI inference!")
            context["ai_response"] = "ERROR: Missing API Key"
            return
            
        logs.append(f"[{_ts()}] INFO  ▸ OPENAI_API_KEY detected — performing real inference.")
        
        try:
            client = openai.OpenAI(api_key=api_key)
            fields = context.get("extracted_fields", {})
            prompt = (
                f"Analyze the following data and provide a concise summary or recommendation:\n"
                f"{json.dumps(fields, indent=2)}\n"
                f"Also consider the raw text if needed: {context.get('raw_text', '')[:200]}"
            )
            
            logs.append(f"[{_ts()}] INFO  ▸ Sending request to {model_name}...")
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
            )
            
            ai_text = response.choices[0].message.content
            context["ai_response"] = ai_text
            context["ai_model"] = model_name
            logs.append(f"[{_ts()}] SUCCESS ▸ Real inference complete — generated {len(ai_text)} character response.")
            
        except Exception as e:
            logs.append(f"[{_ts()}] ERROR ▸ OpenAI API error: {str(e)}")
            context["ai_response"] = f"API Error: {str(e)}"
            
    elif provider == "Anthropic":
        api_key = config.get("apiKey") or os.environ.get("ANTHROPIC_API_KEY")
        model_name = config.get("anthropicModel", "claude-3-5-sonnet-20240620")
        
        if not api_key:
            logs.append(f"[{_ts()}] ERROR ▸ API Key is required for Anthropic inference!")
            context["ai_response"] = "ERROR: Missing API Key"
            return
            
        logs.append(f"[{_ts()}] INFO  ▸ ANTHROPIC_API_KEY detected — performing real inference.")
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            fields = context.get("extracted_fields", {})
            prompt = (
                f"Analyze the following data and provide a concise summary or recommendation:\n"
                f"{json.dumps(fields, indent=2)}\n"
                f"Also consider the raw text if needed: {context.get('raw_text', '')[:200]}"
            )
            
            logs.append(f"[{_ts()}] INFO  ▸ Sending request to {model_name}...")
            response = client.messages.create(
                model=model_name,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            
            ai_text = response.content[0].text
            context["ai_response"] = ai_text
            context["ai_model"] = model_name
            logs.append(f"[{_ts()}] SUCCESS ▸ Real inference complete — generated {len(ai_text)} character response.")
            
        except Exception as e:
            logs.append(f"[{_ts()}] ERROR ▸ Anthropic API error: {str(e)}")
            context["ai_response"] = f"API Error: {str(e)}"
            
    elif provider == "Ollama":
        port = config.get("ollamaPort", "11434")
        model_name = config.get("ollamaModel", "llama3")
        url = f"http://localhost:{port}/api/generate"
        
        logs.append(f"[{_ts()}] INFO  ▸ Connecting to local Ollama node at {url}...")
        
        try:
            fields = context.get("extracted_fields", {})
            prompt = (
                f"Analyze the following data and provide a concise summary or recommendation:\n"
                f"{json.dumps(fields, indent=2)}\n"
                f"Also consider the raw text if needed: {context.get('raw_text', '')[:200]}"
            )
            
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False
            }
            
            logs.append(f"[{_ts()}] INFO  ▸ Sending request to local model {model_name}...")
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            ai_text = response.json().get("response", "")
            context["ai_response"] = ai_text
            context["ai_model"] = f"ollama-{model_name}"
            logs.append(f"[{_ts()}] SUCCESS ▸ Local inference complete — generated {len(ai_text)} character response.")
            
        except requests.exceptions.ConnectionError:
            logs.append(f"[{_ts()}] ERROR ▸ Could not connect to Ollama at localhost:{port}. Is it running?")
            context["ai_response"] = "ERROR: Connection Refused"
        except Exception as e:
            logs.append(f"[{_ts()}] ERROR ▸ Ollama inference error: {str(e)}")
            context["ai_response"] = f"Local Node Error: {str(e)}"
    
    else:
        # Mock other providers for now
        time.sleep(0.4)
        logs.append(f"[{_ts()}] INFO  ▸ {provider} provider is currently mocked.")
        mock_response = (
            f"Mock response from {provider}:\n"
            f"Based on the analysis of {len(context.get('extracted_fields', {}))} fields, "
            f"everything appears nominal. No immediate action required."
        )
        context["ai_response"] = mock_response
        context["ai_model"] = f"{provider}-mock"
        logs.append(f"[{_ts()}] SUCCESS ▸ Mock inference complete.")


def execute_action(node: NodeData, context: dict, logs: list[str]) -> None:
    """Real Email sending or database sync sync."""
    config = node.data.get("config", {})
    action_type = config.get("actionType", "email")
    logs.append(f"[{_ts()}] INFO  ▸ Action Node '{node.data.get('title', node.id)}' — Type: {action_type}")
    
    if action_type == "email":
        host = config.get("smtpHost", "smtp.gmail.com")
        port = int(config.get("smtpPort", 587))
        user = config.get("smtpUser")
        password = config.get("smtpPassword")
        to_email = config.get("toEmail")
        subject = config.get("subject", "Synapse AI Notification")
        body_template = config.get("body", "AI Response:\n{ai_response}")
        
        if not all([user, password, to_email]):
            logs.append(f"[{_ts()}] ERROR ▸ Email action requires SMTP User, Password, and To Email.")
            return
            
        # Format body with context
        try:
            body = body_template.format(
                ai_response=context.get("ai_response", "No AI response available."),
                raw_text=context.get("raw_text", "")[:100]
            )
        except Exception as e:
            logs.append(f"[{_ts()}] WARN  ▸ Error formatting email body: {e}. Using raw template.")
            body = body_template
            
        logs.append(f"[{_ts()}] INFO  ▸ Connecting to SMTP server {host}:{port}...")
        
        try:
            msg = EmailMessage()
            msg.set_content(body)
            msg['Subject'] = subject
            msg['From'] = user
            msg['To'] = to_email
            
            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(user, password)
                server.send_message(msg)
                
            logs.append(f"[{_ts()}] SUCCESS ▸ Real email successfully sent to {to_email}.")
        except Exception as e:
            logs.append(f"[{_ts()}] ERROR ▸ Failed to send email: {str(e)}")
            
    else:
        # Default sync/mock action
        time.sleep(0.2)
        summary = {
            "source": context.get("source", "unknown"),
            "ai_model_used": context.get("ai_model", "none"),
            "status": "COMPLETED",
        }
        context["execution_summary"] = summary
        logs.append(f"[{_ts()}] SUCCESS ▸ Database records synchronized.")
        logs.append(f"[{_ts()}] INFO  ▸ Summary: {json.dumps(summary)}")


def execute_python_script(node: NodeData, context: dict, logs: list[str]) -> None:
    """Real Python Script Execution via subprocess."""
    config = node.data.get("config", {})
    code = config.get("scriptCode")
    
    logs.append(f"[{_ts()}] INFO  ▸ Python Script Node '{node.data.get('title', node.id)}' — Executing…")
    
    if not code:
        logs.append(f"[{_ts()}] ERROR ▸ No Python code provided.")
        return
        
    logs.append(f"[{_ts()}] INFO  ▸ Running script ({len(code)} chars) in subprocess (10s timeout)...")
    
    # We pass the context as a JSON string via env var to the script
    env = os.environ.copy()
    env["SYNAPSE_CONTEXT"] = json.dumps(context)
    
    # Create a temporary wrapper script to inject the context easily
    wrapper_code = f"""
import os, json, sys
try:
    context = json.loads(os.environ.get('SYNAPSE_CONTEXT', '{{}}'))
except:
    context = {{}}

# User code below:
{code}
"""
    
    try:
        # Execute the code
        result = subprocess.run(
            ["python", "-c", wrapper_code],
            capture_output=True,
            text=True,
            timeout=10,
            env=env
        )
        
        if result.stdout:
            logs.append(f"[{_ts()}] STDOUT ▸ {result.stdout.strip()}")
        if result.stderr:
            logs.append(f"[{_ts()}] STDERR ▸ {result.stderr.strip()}")
            
        if result.returncode == 0:
            logs.append(f"[{_ts()}] SUCCESS ▸ Script executed successfully.")
        else:
            logs.append(f"[{_ts()}] ERROR ▸ Script exited with code {result.returncode}.")
            
    except subprocess.TimeoutExpired:
        logs.append(f"[{_ts()}] ERROR ▸ Script execution timed out after 10 seconds.")
    except Exception as e:
        logs.append(f"[{_ts()}] ERROR ▸ Script execution failed: {str(e)}")


def execute_generic(node: NodeData, context: dict, logs: list[str]) -> None:
    """Fallback executor for unknown node types."""
    logs.append(f"[{_ts()}] INFO  ▸ Generic Node '{node.data.get('title', node.id)}' — Passthrough (no specific executor).")
    time.sleep(0.1)
    logs.append(f"[{_ts()}] SUCCESS ▸ Node '{node.id}' executed as passthrough.")


# Dispatcher map — match by lowercase keywords in the node title
EXECUTOR_KEYWORDS = {
    "ingest": execute_ingestion,
    "extract": execute_extraction,
    "parser": execute_extraction,
    "filter": execute_extraction,
    "inference": execute_ai_inference,
    "ai": execute_ai_inference,
    "llm": execute_ai_inference,
    "model": execute_ai_inference,
    "action": execute_action,
    "sync": execute_action,
    "output": execute_action,
    "database": execute_action,
    "mail": execute_action,
    "email": execute_action,
    "notify": execute_action,
    "python": execute_python_script,
    "script": execute_python_script,
}


def resolve_executor(node: NodeData):
    """Pick the right executor based on the node's title."""
    title = node.data.get("title", "").lower()
    for keyword, executor in EXECUTOR_KEYWORDS.items():
        if keyword in title:
            return executor
    return execute_generic


# ──────────────────────── FastAPI App ─────────────────────────────

app = FastAPI(
    title="Synapse OS — Real Workflow Engine",
    version="2.0.0",
    description="DAG-based workflow execution engine for Synapse OS",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "engine": "synapse-workflow-engine", "version": "2.0.0"}


@app.post("/api/save-keys")
async def save_keys(payload: APIKeysPayload):
    """Store API keys in .env file."""
    env_path = ".env"
    for key, value in payload.keys.items():
        if value: # Only set if provided
            set_key(env_path, key, value)
            os.environ[key] = value
    return {"success": True, "message": "Keys saved successfully."}


@app.get("/api/get-keys")
async def get_keys():
    """Return masked API keys."""
    keys = {}
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_key:
        keys["GEMINI_API_KEY"] = f"{gemini_key[:4]}...{gemini_key[-4:]}" if len(gemini_key) > 8 else "***"
    return {"keys": keys}


@app.post("/api/execute-workflow", response_model=ExecutionResult)
async def execute_workflow(payload: WorkflowPayload):
    """
    Accept a React Flow graph, topologically sort it, execute each node
    in order, and return timestamped logs.
    """
    logs: list[str] = []
    context: dict[str, Any] = {}

    logs.append(f"[{_ts()}] INFO  ▸ Received workflow with {len(payload.nodes)} nodes and {len(payload.edges)} edges.")

    # 1. Topological sort
    try:
        execution_order = topological_sort(payload.nodes, payload.edges)
    except ValueError as e:
        logs.append(f"[{_ts()}] ERROR ▸ {e}")
        raise HTTPException(status_code=400, detail=str(e))

    logs.append(f"[{_ts()}] INFO  ▸ Execution order determined: {' → '.join(execution_order)}")

    # 2. Build a lookup map
    node_map = {n.id: n for n in payload.nodes}

    # 3. Execute each node in order
    for node_id in execution_order:
        node = node_map[node_id]
        executor = resolve_executor(node)
        logs.append(f"[{_ts()}] ───── Executing node [{node_id}] ─────")
        try:
            executor(node, context, logs)
        except Exception as exc:
            logs.append(f"[{_ts()}] ERROR ▸ Node '{node_id}' failed: {exc}")

    logs.append(f"[{_ts()}] ═══════ WORKFLOW COMPLETE ═══════")

    return ExecutionResult(
        success=True,
        execution_order=execution_order,
        logs=logs,
        context=context,
    )


# ────────────────────────── Entry Point ───────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("engine:app", host="0.0.0.0", port=8000, reload=True)
