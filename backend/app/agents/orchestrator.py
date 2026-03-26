import os
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

from app.agents.state import AgentState, RouteDecision
from app.agents.tools import get_student_balance, search_school_policy, generate_payment_link
from app.core.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
# --- Hybrid LLM Setup ---
# openai_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=settings.OPENAI_API_KEY)

gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    temperature=0, 
    google_api_key=settings.GOOGLE_API_KEY
)


# --- 1. Supervisor Node ---
supervisor_router = gemini_llm.with_structured_output(RouteDecision)

async def supervisor_node(state: AgentState):
    prompt = f"""You are EduIntellect. Route to the correct specialist.
    sql_agent: for balances/fees.
    policy_rag_agent: for handbook/rules.
    payment_agent: for paying.
    FINISH: if the question is fully answered or just a greeting.

    History: {state['messages']}"""
    decision = await supervisor_router.ainvoke([HumanMessage(content=prompt)])
    return {"next_agent": decision.next_agent}

# --- 2. SQL Specialist Node (FIXED: Handles execution) ---
async def sql_agent_node(state: AgentState):
    # agent_llm = openai_llm.bind_tools([get_student_balance])
    agent_llm = gemini_llm.bind_tools([get_student_balance])
    messages = [
        SystemMessage(content="You are a financial clerk. Use get_student_balance to find info."),
        HumanMessage(content=f"User phone: {state['guardian_phone']}")
    ] + state["messages"]
    
    # 1. Ask the LLM
    response = await agent_llm.ainvoke(messages)
    
    # 2. If the LLM wants a tool, run it and get the final answer
    if response.tool_calls:
        tool_msgs = []
        for tc in response.tool_calls:
            # We use .invoke because the tool itself is synchronous
            result = get_student_balance.invoke(tc["args"])
            tool_msgs.append(ToolMessage(tool_call_id=tc["id"], content=str(result)))
        
        # 3. Get the final conversational answer based on the tool result
        final_response = await agent_llm.ainvoke(messages + [response] + tool_msgs)
        return {"messages": [response] + tool_msgs + [final_response]}
    
    return {"messages": [response]}

# --- 3. Policy RAG Specialist Node (FIXED: Handles execution) ---
async def policy_rag_node(state: AgentState):
    agent_llm = gemini_llm.bind_tools([search_school_policy])
    messages = [
        SystemMessage(content="You are a school administrator. Use search_school_policy."),
        HumanMessage(content=f"School ID: {state['school_id']}")
    ] + state["messages"]
    
    response = await agent_llm.ainvoke(messages)
    
    if response.tool_calls:
        tool_msgs = []
        for tc in response.tool_calls:
            result = search_school_policy.invoke(tc["args"])
            tool_msgs.append(ToolMessage(tool_call_id=tc["id"], content=str(result)))
        
        final_response = await agent_llm.ainvoke(messages + [response] + tool_msgs)
        return {"messages": [response] + tool_msgs + [final_response]}
    
    return {"messages": [response]}

# --- 4. Payment Specialist Node (FIXED: Handles execution) ---
# --- 4. Payment Specialist Node (FIXED: Uses Gemini now) ---
async def payment_agent_node(state: AgentState):
    # CHANGE THIS LINE:
    agent_llm = gemini_llm.bind_tools([generate_payment_link])
    
    messages = [
        SystemMessage(content="You are a cashier. Use generate_payment_link."),
        HumanMessage(content=f"User phone: {state['guardian_phone']}")
    ] + state["messages"]
    
    response = await agent_llm.ainvoke(messages)
    
    if response.tool_calls:
        tool_msgs = []
        for tc in response.tool_calls:
            result = generate_payment_link.invoke(tc["args"])
            tool_msgs.append(ToolMessage(tool_call_id=tc["id"], content=str(result)))
        
        final_response = await agent_llm.ainvoke(messages + [response] + tool_msgs)
        return {"messages": [response] + tool_msgs + [final_response]}
    
    return {"messages": [response]}
# --- Graph Compilation ---
def route_to_agent(state: AgentState) -> str:
    return state["next_agent"]

workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("sql_agent", sql_agent_node)
workflow.add_node("policy_rag_agent", policy_rag_node)
workflow.add_node("payment_agent", payment_agent_node)

workflow.add_edge(START, "supervisor")
workflow.add_conditional_edges("supervisor", route_to_agent, {
    "sql_agent": "sql_agent",
    "policy_rag_agent": "policy_rag_agent",
    "payment_agent": "payment_agent",
    "FINISH": END
})
workflow.add_edge("sql_agent", "supervisor")
workflow.add_edge("policy_rag_agent", "supervisor")
workflow.add_edge("payment_agent", "supervisor")

eduintellect_agent = workflow.compile()