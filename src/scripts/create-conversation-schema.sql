-- =====================================================
-- CHATBOT CONVERSATION HISTORY SCHEMA
-- =====================================================
-- CLEAR NAMING: All tables prefixed with 'chatbot_' to avoid conflicts
-- SEPARATION: Completely separate from business data (customers, orders, etc.)
-- PURPOSE: Store AI chatbot conversations for Facebook Messenger & Webchat

-- =====================================================
-- TABLE: chatbot_conversations
-- =====================================================
-- Main table to group conversations by user and platform
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier VARCHAR(255) NOT NULL, -- Facebook PSID, webchat session, etc.
    platform_type VARCHAR(50) NOT NULL, -- 'facebook_messenger', 'webchat', 'whatsapp', etc.
    session_identifier VARCHAR(255), -- Optional session grouping
    conversation_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure one active conversation per user per platform
    CONSTRAINT unique_active_user_platform UNIQUE(user_identifier, platform_type, is_active)
);

-- =====================================================
-- TABLE: chatbot_messages
-- =====================================================
-- Store individual messages within conversations
CREATE TABLE IF NOT EXISTS chatbot_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(conversation_id) ON DELETE CASCADE,
    
    -- Message classification
    message_role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'function_call', 'function_result'
    message_content TEXT NOT NULL,
    
    -- Function calling metadata (when role involves functions)
    executed_function_name VARCHAR(100), -- Name of executed function (getCustomerByPhone, etc.)
    function_input_parameters JSONB, -- Input parameters sent to function
    function_output_result JSONB, -- Result returned from function
    function_execution_status VARCHAR(20), -- 'success', 'error', 'timeout'
    
    -- Timestamps
    message_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data validation
    CHECK (message_role IN ('user', 'assistant', 'function_call', 'function_result')),
    CHECK (
        (message_role IN ('function_call', 'function_result') AND executed_function_name IS NOT NULL) OR 
        (message_role NOT IN ('function_call', 'function_result') AND executed_function_name IS NULL)
    )
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Fast lookups by user and platform
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_platform 
ON chatbot_conversations(user_identifier, platform_type);

-- Fast lookups by last activity (for cleanup and active conversations)
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_last_message 
ON chatbot_conversations(last_message_at DESC);

-- Fast message retrieval within conversations (chronological order)
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_time 
ON chatbot_messages(conversation_id, message_created_at);

-- Fast filtering by message role
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_role 
ON chatbot_messages(message_role);

-- Fast function call analysis (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_function_calls 
ON chatbot_messages(executed_function_name, function_execution_status) 
WHERE executed_function_name IS NOT NULL;

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================
-- Function to update conversation's last_message_at when messages are added
CREATE OR REPLACE FUNCTION chatbot_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chatbot_conversations 
    SET last_message_at = NOW() 
    WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_message_at
CREATE TRIGGER trigger_chatbot_update_last_message
    AFTER INSERT OR UPDATE OR DELETE ON chatbot_messages
    FOR EACH ROW EXECUTE FUNCTION chatbot_update_conversation_last_message();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Clean up old chatbot conversations (data retention)
CREATE OR REPLACE FUNCTION chatbot_cleanup_old_conversations(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_conversations_count INTEGER;
BEGIN
    DELETE FROM chatbot_conversations 
    WHERE last_message_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_conversations_count = ROW_COUNT;
    RETURN deleted_conversations_count;
END;
$$ LANGUAGE plpgsql;

-- Get chatbot usage statistics
CREATE OR REPLACE FUNCTION chatbot_get_usage_statistics()
RETURNS TABLE(
    total_conversations BIGINT,
    active_conversations BIGINT,
    total_messages BIGINT,
    messages_by_platform JSONB,
    function_calls_by_name JSONB,
    average_messages_per_conversation NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM chatbot_conversations) as total_conversations,
        (SELECT COUNT(*) FROM chatbot_conversations WHERE is_active = true) as active_conversations,
        (SELECT COUNT(*) FROM chatbot_messages) as total_messages,
        (SELECT jsonb_object_agg(platform_type, conversation_count) 
         FROM (
             SELECT cc.platform_type, COUNT(cm.message_id) as conversation_count
             FROM chatbot_conversations cc
             LEFT JOIN chatbot_messages cm ON cc.conversation_id = cm.conversation_id
             GROUP BY cc.platform_type
         ) platform_stats) as messages_by_platform,
        (SELECT jsonb_object_agg(executed_function_name, call_count)
         FROM (
             SELECT executed_function_name, COUNT(*) as call_count
             FROM chatbot_messages 
             WHERE executed_function_name IS NOT NULL
             GROUP BY executed_function_name
         ) function_stats) as function_calls_by_name,
        (SELECT ROUND(AVG(message_count), 2)
         FROM (
             SELECT COUNT(cm.message_id) as message_count
             FROM chatbot_conversations cc
             LEFT JOIN chatbot_messages cm ON cc.conversation_id = cm.conversation_id
             GROUP BY cc.conversation_id
         ) conversation_sizes) as average_messages_per_conversation;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION & TESTING
-- =====================================================

-- Verify that all chatbot tables were created successfully
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'chatbot_%'
ORDER BY tablename;

-- Verify that all chatbot indexes were created successfully  
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'chatbot_%'
ORDER BY tablename, indexname;

-- Verify that all chatbot functions were created successfully
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname LIKE 'chatbot_%'
ORDER BY proname;

-- Test the statistics function (should return zeros initially)
SELECT * FROM chatbot_get_usage_statistics();

-- =====================================================
-- OPTIONAL: SAMPLE TEST DATA
-- =====================================================
-- Uncomment to insert test data for development/testing
/*
-- Test conversation for Facebook Messenger
INSERT INTO chatbot_conversations (user_identifier, platform_type, session_identifier) 
VALUES ('facebook_test_user_123', 'facebook_messenger', 'test_session_001');

-- Test messages for the conversation
INSERT INTO chatbot_messages (conversation_id, message_role, message_content) VALUES
(
    (SELECT conversation_id FROM chatbot_conversations WHERE user_identifier = 'facebook_test_user_123'), 
    'user', 
    'Hola, necesito ayuda con mi orden'
),
(
    (SELECT conversation_id FROM chatbot_conversations WHERE user_identifier = 'facebook_test_user_123'), 
    'assistant', 
    'Hola! Claro, te ayudo con tu orden. ¿Podrías darme tu número de teléfono?'
);

-- Test function call message
INSERT INTO chatbot_messages (
    conversation_id, 
    message_role, 
    message_content,
    executed_function_name,
    function_input_parameters,
    function_output_result,
    function_execution_status
) VALUES (
    (SELECT conversation_id FROM chatbot_conversations WHERE user_identifier = 'facebook_test_user_123'),
    'function_result',
    'Customer information retrieved successfully',
    'getCustomerByPhone',
    '{"phone": "407-288-6040"}',
    '{"customerid": "9318667506", "firstname": "Test", "lastname": "Customer"}',
    'success'
);
*/