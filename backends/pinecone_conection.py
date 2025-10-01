from pinecone import Pinecone

pc = Pinecone(api_key="insert your key here")
index = pc.Index("rag")

def RAG_search(keyword: str, top_k: int, space: str = "arXiv"):
    results = index.search(
        namespace=space, 
        query={
            "inputs": {"text": keyword}, 
            "top_k": top_k
        },
        fields=["link", "title","text"]
    )
    return results