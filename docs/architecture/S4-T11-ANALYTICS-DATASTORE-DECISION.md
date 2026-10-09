# S4-T11: Analytics Data-Store Architecture Decision Record (ADR)

## Status: ACCEPTED

## Context
BP-CMS collects granular performance telemetry, platform insights, and audience comments across multiple publishing platforms (YouTube, Instagram, Facebook). During Phase 2, analytics records were prototyped in separate Google Sheets tabs (`SOCIAL_ANALYTICS`, `ANALYTICS_INTELLIGENCE`, `STRATEGY_RECOMMENDATIONS`, `SOCIAL_COMMENTS`, `COMMENT_INTELLIGENCE`).
Sprint 4 migrates the primary operational transactional store to Cloud Firestore. We must decide the authoritative data-store architecture for analytics and audience intelligence data.

## Decision
1. **Cloud Firestore Authoritative for Analytics Aggregates & Insights**:
   - `social_analytics`: Stores normalized engagement metrics per content master / video across platforms.
   - `analytics_intelligences`: Stores AI-generated performance intelligence and diagnosis summaries.
   - `strategy_recommendations`: Stores prioritized content generation and optimization strategies.
   - `comment_intelligences`: Stores misconception clusters, FAQ extractions, and audience sentiment synthesis.
2. **Comment Volume Scalability & Spark Tier Quota Protection**:
   - High-frequency individual comments (`social_comments`) are stored in Firestore with batching and document size controls (max 1MB).
   - Read queries for analytics dashboards use aggregated summary records rather than large unbounded scans over raw individual comments, ensuring Spark Free Tier compliance.
3. **Google Sheets Isolation**:
   - Google Sheets is completely disconnected from real-time analytics writes.
   - Optional batch CSV/Sheets export remains an asynchronous manual export utility only.
