const OpenAI = require('openai');
const FunctionCallingSystem = require('./function-calling');

class AIAgent {
    constructor() {
        console.log('🔧 Initializing AIAgent...');
        console.log('🔑 API Key available:', !!process.env.OPENAI_API_KEY);
        
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.functionCalling = new FunctionCallingSystem();
        this.model = 'gpt-4o';
        
        console.log('✅ AIAgent initialized successfully');
    }

    async run(chatHistory) {
        console.log('🤖 Running AI agent with history length:', chatHistory.length);
        
        const tools = this.functionCalling.getAvailableFunctions().map(f => ({ type: 'function', function: f }));
        console.log('🔧 Available tools:', tools.length);
        // Inject system guidance to return minimal, semantic HTML for normal text outputs
        const htmlSystem = {
            role: 'system',
            content: [
                'You are the Woodstock Outlet assistant. For any NORMAL assistant text (not tool/function JSON), output minimal, semantic HTML instead of Markdown.',
                'Rules:',
                '- Prefer <p>, <ul>, <li>, <strong>, <em>, <small>, <a>, <div>, <span> with simple class names when helpful.',
                '- Do not inline big styles; keep HTML clean. No scripts. Keep it short and skimmable.',
                '- If suggesting links, include full https URL in <a> with target="_blank" and rel="noopener".',
                '- When summarizing a product, use a short <div class="summary"><p>…</p><ul><li>…</li></ul></div>.',
                '- Do NOT wrap or alter any tool/function result blocks produced by the backend; those are handled by the frontend renderer.'
            ].join('\n')
        };

        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: [htmlSystem, ...chatHistory],
            tools: tools,
            stream: true,
        });

        return stream;
    }
}

module.exports = AIAgent;