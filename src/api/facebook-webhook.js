// Environment variables
require('dotenv').config();
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'woodstock_verify_token_2024';

// Import AI Agent and Conversation Service
const AIAgent = require('../services/ai-agent');
const ConversationService = require('../services/conversation-service');

// Initialize services
const aiAgent = new AIAgent();
const conversationService = new ConversationService();

// Main handler function for Vercel
export default async function handler(req, res) {
  const { method, query, body } = req;

  // Handle GET request for webhook verification
  if (method === 'GET') {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    console.log(`🔍 Webhook verification attempt: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      console.log('✅ Facebook webhook verified');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Facebook webhook verification failed');
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // Handle POST request for messages
  if (method === 'POST') {
    try {
      if (body.object === 'page') {
        for (const entry of body.entry) {
          for (const event of entry.messaging) {
            if (event.message && event.message.text) {
              const senderId = event.sender.id;
              const message = event.message.text;
              
              console.log(`📱 Facebook message from ${senderId}: ${message}`);
              
              try {
                // Get conversation history from Redis/PostgreSQL
                let conversationHistory = await conversationService.getConversationHistory(senderId, 'facebook_messenger');
                
                // Add user message to history
                conversationHistory.push({
                  role: 'user',
                  content: message
                });
                
                console.log(`🤖 Running AI agent with history length: ${conversationHistory.length}`);
                
                // Process with AI Agent (same as webchat)
                const stream = await aiAgent.run(conversationHistory);
                
                // Collect full response
                let fullResponse = '';
                let pendingToolCalls = new Map();
                
                for await (const chunk of stream) {
                  const choice = chunk.choices[0];
                  
                  // Handle content
                  if (choice?.delta?.content) {
                    fullResponse += choice.delta.content;
                  }
                  
                  // Handle function calls (same as webchat)
                  if (choice?.delta?.tool_calls) {
                    const toolCalls = choice.delta.tool_calls;
                    for (const toolCall of toolCalls) {
                      if (toolCall.index !== undefined) {
                        const index = toolCall.index;
                        
                        if (!pendingToolCalls.has(index)) {
                          pendingToolCalls.set(index, {
                            id: toolCall.id || '',
                            type: toolCall.type || 'function',
                            function: {
                              name: '',
                              arguments: ''
                            }
                          });
                        }
                        
                        const pending = pendingToolCalls.get(index);
                        
                        if (toolCall.function) {
                          if (toolCall.function.name) {
                            pending.function.name += toolCall.function.name;
                          }
                          if (toolCall.function.arguments) {
                            pending.function.arguments += toolCall.function.arguments;
                          }
                        }
                      }
                    }
                  }
                  
                  // Execute function calls (same as webchat)
                  if (choice?.finish_reason === 'tool_calls') {
                    for (const [index, toolCall] of pendingToolCalls) {
                      if (toolCall.function.name && toolCall.function.arguments) {
                        console.log(`🔧 Executing function: ${toolCall.function.name}`);
                        
                        try {
                          const functionResult = await aiAgent.functionCalling.executeFunction(
                            toolCall.function.name, 
                            JSON.parse(toolCall.function.arguments)
                          );
                          
                          fullResponse += `\n\n**Function Result (${toolCall.function.name}):**\n${JSON.stringify(functionResult, null, 2)}\n\n`;
                        } catch (funcError) {
                          console.error(`Function execution error: ${toolCall.function.name}`, funcError);
                          fullResponse += `\n\n**Function Error (${toolCall.function.name}):** ${funcError.message}\n\n`;
                        }
                      }
                    }
                    pendingToolCalls.clear();
                  }
                }
                
                // Add assistant response to history
                conversationHistory.push({
                  role: 'assistant',
                  content: fullResponse
                });
                
                // Save conversation history to Redis/PostgreSQL
                await conversationService.saveConversationHistory(senderId, 'facebook_messenger', conversationHistory);
                
                console.log(`✅ AI response generated and saved for ${senderId}`);
                
                // Send response to Facebook
                await sendFacebookMessage(senderId, fullResponse);
                
              } catch (error) {
                console.error(`❌ AI processing error for ${senderId}:`, error);
                await sendFacebookMessage(senderId, 'Sorry, I encountered an error processing your request. Please try again.');
              }
            }
          }
        }
        
        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).json({ error: 'Invalid object type' });
      }
    } catch (error) {
      console.error('❌ Facebook webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

// Send message to Facebook
async function sendFacebookMessage(recipientId, message) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
    }
    
    console.log(`✅ Facebook message sent to ${recipientId}`);
  } catch (error) {
    console.error('❌ Facebook send message error:', error);
  }
}