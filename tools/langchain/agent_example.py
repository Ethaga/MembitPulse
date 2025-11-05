"""
Example LangChain agent that uses the Membit tool wrapper.

Prerequisites:
  - pip install -r requirements.txt
  - export MEMBIT_API_KEY="..."
  - export OPENAI_API_KEY="..."    # if using OpenAI

Run:
  python agent_example.py
"""
import os
from langchain.agents import Tool, initialize_agent
from langchain.chat_models import ChatOpenAI

from membit_tool import membit_search_posts, membit_search_clusters


def make_tools():
    tools = []

    # Tool for searching posts
    def search_posts_tool(query: str) -> str:
        try:
            return membit_search_posts(query, limit=8)
        except Exception as e:
            return f"Membit posts search failed: {e}"

    tools.append(Tool(name="membit_search_posts", func=search_posts_tool, description="Search recent social posts by query. Input: a string query."))

    # Tool for searching clusters
    def search_clusters_tool(query: str) -> str:
        try:
            return membit_search_clusters(query, limit=6)
        except Exception as e:
            return f"Membit clusters search failed: {e}"

    tools.append(Tool(name="membit_search_clusters", func=search_clusters_tool, description="Search topic clusters. Input: a string query."))

    return tools


def main():
    # LLM selection: uses OPENAI_API_KEY env by default for ChatOpenAI
    llm = ChatOpenAI(temperature=0)

    tools = make_tools()

    agent = initialize_agent(
        tools,
        llm,
        agent="zero-shot-react-description",
        verbose=True,
    )

    # Example query
    query = "Assess the virality likelihood and give a 0-100 score for 'post-quantum cryptography', summarise top reasons."
    print("Running agent with query:\n", query)
    resp = agent.run(query)
    print("\nAgent response:\n", resp)


if __name__ == '__main__':
    main()
