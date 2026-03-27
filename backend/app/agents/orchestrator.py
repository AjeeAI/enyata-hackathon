import os
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver 
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agents.state import AgentState, RouteDecision
from app.agents.tools import get_student_balance, search_school_policy, generate_payment_link
from app.core.config import settings

# --- Hybrid LLM Setup ---
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    temperature=0, 
    google_api_key=settings.GOOGLE_API_KEY
)

# --- 1. Supervisor Node (UPDATED PROMPT) ---
supervisor_router = gemini_llm.with_structured_output(RouteDecision)

async def supervisor_node(state: AgentState):
    system_prompt = SystemMessage(content="""You are EduIntellect, the routing supervisor for schools. 
    Route the conversation to the correct specialist based on the user's latest request.
    
    Routes:
    - sql_agent: for student balances, owed fees, or financial records.
    - policy_rag_agent: for school rules, handbook questions, or general policies.
    - payment_agent: for generating payment links or paying fees.
    - general_agent: for greetings (hello, hi), small talk, or general helpfulness that doesn't need data.
    - FINISH: only use this if the user's request has been fully addressed.
    """)
    
    messages = [system_prompt] + state['messages']
    decision = await supervisor_router.ainvoke(messages)
    return {"next_agent": decision.next_agent}

# --- Helper Function for DRY Tool Execution ---
async def run_specialist(state: AgentState, tools: list, system_instruction: str):
    try:
        agent_llm = gemini_llm.bind_tools(tools)
        messages = [SystemMessage(content=system_instruction)] + state["messages"]
        
        response = await agent_llm.ainvoke(messages)
        
        if response.tool_calls:
            tool_msgs = []
            for tc in response.tool_calls:
                tool_map = {tool.name: tool for tool in tools}
                selected_tool = tool_map.get(tc["name"])
                
                if not selected_tool:
                    continue
                
                # Execute the tool (RAG search, SQL query, etc.)
                result = selected_tool.invoke(tc["args"])
                tool_msgs.append(ToolMessage(tool_call_id=tc["id"], content=str(result), name=tc["name"]))
                
            final_response = await agent_llm.ainvoke(messages + [response] + tool_msgs)
            return {"messages": [response] + tool_msgs + [final_response]}
        
        return {"messages": [response]}
        
    except Exception as e:
        print(f"Specialist Error: {e}")
        # THE FIX: Ensure the error is returned as the AI, not the Human
        from langchain_core.messages import AIMessage 
        error_msg = AIMessage(content="I'm having a bit of trouble accessing our records right now. Please try again in a moment or contact the school office directly.")
        return {"messages": [error_msg]}
# --- 2. SQL Specialist Node ---
async def sql_agent_node(state: AgentState):
    instruction = f"You are a financial clerk. Use get_student_balance. User phone: {state.get('guardian_phone', 'Unknown')}"
    return await run_specialist(state, [get_student_balance], instruction)

# --- 3. Policy RAG Specialist Node ---
async def policy_rag_node(state: AgentState):
    # 1. Grab the ID and handle the "Unknown" case
    school_id = state.get('school_id')
    
    if not school_id or school_id == "mock-school-id-for-hackathon":
        # If we have no ID, don't even try the tool; return a helpful error
        from langchain_core.messages import AIMessage
        return {
            "messages": [AIMessage(content="I'm sorry, I couldn't verify your school's identity. Please try logging in again to access school policies.")]
        }

    # 2. Stronger instruction to force tool usage
    instruction = (
        f"You are a helpful school administrator for the school with ID: {school_id}. "
        "When asked about school rules, fees, or guidelines, you MUST use the 'search_school_policy' tool. "
        "Do not answer based on general knowledge; only use the information returned by the tool. "
        "If the tool finds no relevant information, politely say you don't have that specific policy on file."
    )
    
    return await run_specialist(state, [search_school_policy], instruction)

# --- 4. Payment Specialist Node ---
async def payment_agent_node(state: AgentState):
    instruction = f"You are a cashier. Use generate_payment_link. User phone: {state.get('guardian_phone', 'Unknown')}"
    return await run_specialist(state, [generate_payment_link], instruction)

# --- 5. NEW: General Conversation Node ---
async def general_agent_node(state: AgentState):
    """Handles greetings and general non-data queries."""
    instruction = """You are the friendly AI assistant for EduIntellect schools. 
    Warmly acknowledge greetings and introduce yourself. Explain that you can help with checking balances, 
    viewing school policies, or generating payment links. Keep your tone helpful and professional."""
    
    # We pass an empty tool list because chit-chat doesn't need external data
    return await run_specialist(state, [], instruction)

# --- Graph Compilation ---
def route_to_agent(state: AgentState) -> str:
    return state["next_agent"]

workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("sql_agent", sql_agent_node)
workflow.add_node("policy_rag_agent", policy_rag_node)
workflow.add_node("payment_agent", payment_agent_node)
workflow.add_node("general_agent", general_agent_node) # <-- ADDED NODE

workflow.add_edge(START, "supervisor")
workflow.add_conditional_edges("supervisor", route_to_agent, {
    "sql_agent": "sql_agent",
    "policy_rag_agent": "policy_rag_agent",
    "payment_agent": "payment_agent",
    "general_agent": "general_agent", # <-- ADDED ROUTE
    "FINISH": END
})

# All specialists exit the graph after finishing their response
workflow.add_edge("sql_agent", END)
workflow.add_edge("policy_rag_agent", END)
workflow.add_edge("payment_agent", END)
workflow.add_edge("general_agent", END) # <-- ADDED EDGE

# THE MEMORY UPGRADE
memory = MemorySaver()
eduintellect_agent = workflow.compile(checkpointer=memory)