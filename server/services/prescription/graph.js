import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Config } from './config.js';
import { VectorStoreManager } from './vector_store.js';
import { MemoryManager } from './memory.js';
import { setup_logger, remove_stopwords } from './utils.js';

const logger = setup_logger('RAGGraph');

const graphStateChannels = {
    question: { value: null, default: () => "" },
    prescription_id: { value: null, default: () => null },
    session_id: { value: null, default: () => "" },
    language: { value: null, default: () => "English" },
    context: { value: null, default: () => [] },
    answer: { value: null, default: () => "" }
};

export class RAGGraph {
    constructor() {
        this.vector_store = new VectorStoreManager();
        this.memory = new MemoryManager();
        if (Config.GOOGLE_API_KEY) {
            this.llm = new ChatGoogleGenerativeAI({
                modelName: Config.GEMINI_MODEL_NAME,
                apiKey: Config.GOOGLE_API_KEY
            });
        }
    }

    async retrieve(state) {
        logger.info("Node: Retrieve");
        const question = state.question;
        const prescription_id = state.prescription_id;
        
        const results = await this.vector_store.search(question, prescription_id);
        const context = results.map(match => match.metadata.text);
        
        return { context: context };
    }

    async generate(state) {
        logger.info("Node: Generate");
        const question = state.question;
        const context = state.context;
        const language = state.language || "English";
        
        const context_str = context.join("\n\n");
        const history = this.memory.getHistory(state.session_id, 5);
        const history_str = history.map(msg => {
            const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            return `${role}: ${remove_stopwords(msg.content)}`;
        }).join("\n");
        
        const prompt = `
        You are a helpful medical assistant. Answer the user's question based on the provided context and chat history.
        
        IMPORTANT INSTRUCTIONS:
        1. Answer in the following language: ${language}
        2. If the user asks about a medicine ("What is this for?"), provide TWO things:
           a) The specific instructions from the prescription (dosage, timing).
           b) General medical knowledge about what the medicine is commonly used for (e.g., "Paracetamol is commonly used for fever and pain relief").
        
        Context from Prescriptions:
        ${context_str}
        
        Chat History:
        ${history_str}
        
        User Question: ${question}
        
        Answer:
        `;
        
        let answer = "Error generating answer.";
        if (this.llm) {
            try {
                const response = await this.llm.invoke(prompt);
                answer = response.content;
            } catch (err) {
                logger.error("LLM Generation Error: " + err);
            }
        }
        
        this.memory.addMessage(state.session_id, "user", question);
        this.memory.addMessage(state.session_id, "ai", answer);
        
        return { answer: answer };
    }

    buildGraph() {
        const workflow = new StateGraph({ channels: graphStateChannels });
        
        workflow.addNode("retrieve", this.retrieve.bind(this));
        workflow.addNode("generate", this.generate.bind(this));
        
        workflow.addEdge("__start__", "retrieve");
        workflow.addEdge("retrieve", "generate");
        workflow.addEdge("generate", END);
        
        return workflow.compile();
    }
}
