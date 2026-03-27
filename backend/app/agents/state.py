import operator
from typing import TypedDict, Annotated, List, Literal
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field

class AgentState(TypedDict):
    """State shared across all agents in the EduIntellect graph."""
    messages: Annotated[List[BaseMessage], operator.add]
    guardian_phone: str
    school_id: str
    next_agent: str

class RouteDecision(BaseModel):
    """Decision on which specialist agent to call next."""
    # ADDED: "general_agent" to handle chit-chat and greetings
    next_agent: Literal["sql_agent", "policy_rag_agent", "payment_agent", "general_agent", "FINISH"] = Field(
        description="Which specialist to call next, general_agent for chit-chat, or FINISH if the task is complete"
    )
    reasoning: str = Field(
        description="Brief explanation for this routing decision"
    )