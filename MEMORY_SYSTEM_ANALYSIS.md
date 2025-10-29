# Woodstock Chatbot Memory System Analysis

## Memory Architecture Overview

The Woodstock chatbot implements a **hybrid memory system** combining PostgreSQL (long-term persistence) with Redis/Upstash (short-term caching) for optimal performance and reliability.

## Memory Stack Components

| Component | Technology | Purpose | TTL |
|-----------|------------|---------|-----|
| **Long-term Memory** | PostgreSQL | Persistent conversation storage | Permanent |
| **Short-term Cache** | Redis/Upstash | Fast conversation retrieval | 1 hour (active), 7 days (inactive) |
| **Session Memory** | PostgreSQL | Enhanced session tracking | 30 days |
| **Function Cache** | Redis/Upstash | API call result caching | 5 minutes |

## Database Schema (Memory Fields)

### Core Memory Tables

**`chatbot_conversations`** - Conversation metadata
- `conversation_id` (UUID) - Primary key
- `user_identifier` (VARCHAR) - User ID across platforms
- `platform_type` (VARCHAR) - facebook_messenger, webchat, instagram
- `conversation_started_at` (TIMESTAMP) - Session start
- `last_message_at` (TIMESTAMP) - Last activity
- `is_active` (BOOLEAN) - Active conversation flag

**`chatbot_messages`** - Individual message storage
- `message_id` (UUID) - Primary key
- `conversation_id` (UUID) - Foreign key to conversations
- `message_role` (VARCHAR) - user, assistant, function_call, function_result
- `message_content` (TEXT) - Actual message text
- `executed_function_name` (VARCHAR) - Function called
- `function_input_parameters` (JSONB) - Function inputs
- `function_output_result` (JSONB) - Function outputs
- `function_execution_status` (VARCHAR) - success, error, timeout
- `message_created_at` (TIMESTAMP) - Message timestamp

**`webchat_sessions`** - Enhanced session tracking
- `session_id` (VARCHAR) - Session identifier
- `device_fingerprint` (VARCHAR) - Device identification
- `user_agent` (TEXT) - Browser information
- `timezone` (VARCHAR) - User timezone
- `potential_matches` (JSONB) - Probabilistic identity matches
- `deterministic_match` (JSONB) - Exact identity matches
- `behavioral_scores` (JSONB) - User behavior patterns
- `product_preferences` (JSONB) - Shopping preferences
- `conversation_style` (JSONB) - Communication patterns

## Memory Types & Storage Strategy

### 1. **Conversation Memory** (Hybrid: PostgreSQL + Redis)
- **Storage**: PostgreSQL as source of truth, Redis for speed
- **Retrieval**: Cache-first strategy with database fallback
- **TTL**: 1 hour active, 7 days inactive
- **Purpose**: Maintain conversation context across sessions

### 2. **Session Memory** (PostgreSQL)
- **Storage**: Enhanced session tracking with device fingerprinting
- **Retention**: 30 days
- **Purpose**: Identity resolution and user deduplication

### 3. **Function Cache** (Redis)
- **Storage**: API call results to avoid repeated external calls
- **TTL**: 5 minutes
- **Purpose**: Performance optimization for external API calls

### 4. **Identity Memory** (PostgreSQL)
- **Storage**: Contact deduplication and identity resolution
- **Retention**: Permanent
- **Purpose**: Cross-platform user identification

## Memory Flow Architecture

```
User Message → AI Agent → Function Calls → Memory Storage
     ↓              ↓           ↓              ↓
Session ID → Conversation → PostgreSQL → Redis Cache
     ↓              ↓           ↓              ↓
Identity → Enhanced → Long-term → Short-term
Resolution  Session    Storage    Cache
```

## Key Features

- **Multi-platform Support**: Facebook, Instagram, Webchat
- **Identity Resolution**: Deterministic + probabilistic matching
- **Function Caching**: Avoid repeated API calls
- **Session Persistence**: Enhanced session tracking
- **Automatic Cleanup**: 90-day retention policy
- **Performance Optimization**: Cache-first retrieval strategy

## Memory System Type: **Hybrid RAG + CAG**

This is **NOT** traditional RAG (Retrieval Augmented Generation) or CAG (Context Augmented Generation). Instead, it's a **conversation memory system** that:

- Stores complete conversation history
- Maintains session context across interactions
- Implements identity resolution for user deduplication
- Uses caching for performance optimization
- Provides long-term memory for customer relationships

The system is designed for **conversational AI** rather than document retrieval, making it a **conversation memory architecture** optimized for customer service chatbots.


