import dotenv from 'dotenv';
import { ragGraphAgent } from "../mastra/agents/rag-graph-agent";

// Load environment variables
dotenv.config();

async function testAction() {
    try {
        console.log('🚀 Starting test...');
        console.log('📝 Query: Phân tích UI/UX của functional requirements sau: thanh toán online?');
        console.log('');
        
        const response = await fetch('http://localhost:3000/api/graph-rag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: 'Phân tích UI/UX của functional requirements sau: thanh toán online?' }),
        });
        const data = await response.json();
        const text = data.text.replace(/```json/g, '').replace(/```/g, '');
        const objectData = JSON.parse(text);
        
        console.log('✅ Success!');
        console.log('📦 Retrieved_context:', JSON.stringify(objectData.retrieved_context, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('❌ Error Message:', error.message);
            if (error.stack) {
                console.error('❌ Stack:', error.stack);
            }
        }
        process.exit(1);
    }
}



testAction();