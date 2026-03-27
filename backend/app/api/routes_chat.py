import json
import re
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.agents.orchestrator import eduintellect_agent

router = APIRouter()

class ChatRequest(BaseModel):
    phone_number: str
    message: str
    thread_id: str 
    school_id: str 

@router.post("/")
async def chat_with_parent(request: ChatRequest):
    async def event_generator():
        full_response_content = ""
        
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "guardian_phone": request.phone_number,
            "school_id": request.school_id, 
            "next_agent": "supervisor"
        }
        
        config = {"configurable": {"thread_id": request.thread_id}}

        try:
            async for event in eduintellect_agent.astream_events(initial_state, config=config, version="v2"):
                kind = event["event"]
                
                if kind == "on_chat_model_stream":
                    node_name = event.get("metadata", {}).get("langgraph_node", "")
                    if node_name == "supervisor":
                        continue
                    
                    chunk = event["data"]["chunk"]
                    content = chunk.content
                    
                    content_str = ""
                    if isinstance(content, str):
                        content_str = content
                    elif isinstance(content, list):
                        content_str = "".join([
                            part.get("text", "") if isinstance(part, dict) else str(part) 
                            for part in content
                        ])
                    
                    if content_str:
                        full_response_content += content_str
                        yield f"data: {json.dumps({'type': 'text', 'content': content_str})}\n\n"
                        
        except Exception as e:
            print(f"CRITICAL GRAPH ERROR: {e}")
            error_msg = "\n\n*(System Note: Encountered an internal error while parsing the AI's response. Please try again.)*"
            yield f"data: {json.dumps({'type': 'text', 'content': error_msg})}\n\n"
            yield "data: [DONE]\n\n"
            return 

        # --- THE FIX: Grab the URL the AI already generated! ---
        # Look for the Interswitch sandbox link in the AI's text
        link_match = re.search(r'(https://sandbox\.interswitchng\.com/pay/[a-zA-Z0-9-]+)', full_response_content)
        payment_link = link_match.group(1) if link_match else None

        # Yield the metadata chunk to trigger the React button
        yield f"data: {json.dumps({'type': 'metadata', 'payment_link': payment_link})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")