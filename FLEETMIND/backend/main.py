"""
FLEETMIND — Python FastAPI Backend Server
Edge-AI AMR Fleet Coordination Platform
Provides REST API endpoints and live WebSocket telemetry for standalone Python deployment.
"""

import asyncio
import json
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="FLEETMIND Edge Fleet-AI API",
    description="Decentralized Autonomous Mobile Robot Coordination Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ActiveWebSockets:
    def __init__(self):
        self.connections: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, data: Dict[str, Any]):
        for ws in self.connections:
            try:
                await ws.send_json(data)
            except Exception:
                pass

manager = ActiveWebSockets()

class CreateTaskRequest(BaseModel):
    task_type: str
    priority: int
    source_x: int
    source_y: int
    dest_x: int
    dest_y: int

class FaultInjectionRequest(BaseModel):
    fault_type: str
    target_id: str = ""
    param_x: int = 0
    param_y: int = 0
    length: int = 3
    horizontal: bool = True

# Health Endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "NOMINAL",
        "service": "FLEETMIND Python Backend",
        "coordination": "Edge-AI Decentralized",
        "active_clients": len(manager.connections)
    }

@app.post("/api/tasks/create")
async def create_task(req: CreateTaskRequest):
    return {
        "status": "ACCEPTED",
        "task_id": f"TSK-PY-{req.priority}",
        "message": f"Task dispatched to edge AMR pool (Priority {req.priority})"
    }

@app.post("/api/fault/inject")
async def inject_fault(req: FaultInjectionRequest):
    return {
        "status": "INJECTED",
        "fault": req.fault_type,
        "target": req.target_id,
        "message": "Fault event broadcast to peer gossip bus"
    }

# Live WebSocket telemetry stream
@app.websocket("/ws/telemetry")
async def websocket_telemetry(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            # Echo or process incoming simulation commands
            await manager.broadcast({
                "type": "ACK",
                "received": msg
            })
    except WebSocketDisconnect:
        manager.disconnect(ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
