from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
import re

# Import the compiled graph from our orchestrator
from app.agents.orchestrator import eduintellect_agent

router = APIRouter()

class ChatRequest(BaseModel):
    phone_number: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    payment_link: str | None = None

@router.post("/", response_model=ChatResponse)
async def chat_with_parent(request: ChatRequest):
    try:
        # Initialize the LangGraph state
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "guardian_phone": request.phone_number,
            "school_id": "mock-school-id-for-hackathon", # Hardcoded for MVP
            "next_agent": "supervisor"
        }
        
        # Invoke the graph asynchronously
        final_state = await eduintellect_agent.ainvoke(initial_state)
        
        # Extract the last message from the agent
        final_reply = final_state["messages"][-1].content
        
        # Simple regex to extract payment link if the payment agent generated one
        url_match = re.search(r'(https?://[^\s]+)', final_reply)
        payment_link = url_match.group(0) if url_match else None
        
        # Clean up the reply to remove the raw URL for better UX
        if payment_link:
            final_reply = final_reply.replace(payment_link, "").strip()
            
        return ChatResponse(reply=final_reply, payment_link=payment_link)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))