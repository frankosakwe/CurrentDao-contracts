# Usage Analytics Contract

## Overview

The Usage Analytics contract provides comprehensive tracking and analysis of platform usage patterns, user engagement metrics, and system performance indicators for the CurrentDAO ecosystem. It enables data-driven decision making while maintaining user privacy through configurable privacy protection mechanisms.

## Features

### 🔍 Usage Tracking System
- **Comprehensive Event Tracking**: Records all contract interactions with detailed metadata
- **Privacy-Protected Analytics**: Optional user address hashing for privacy compliance
- **Multi-Contract Support**: Tracks usage across all platform contracts
- **Real-time Monitoring**: Live tracking of platform activity

### 📊 Engagement Metrics
- **Active User Tracking**: Daily, weekly, and monthly active users
- **Transaction Analytics**: Total transactions and average gas consumption
- **User Retention**: Retention rate calculations and user lifecycle tracking
- **Activity Patterns**: Peak usage times and user behavior analysis

### ⚡ Performance Indicators
- **Contract Performance**: Execution time and success rate tracking
- **Gas Efficiency**: Gas usage patterns and optimization opportunities
- **System Health**: Uptime monitoring and error rate tracking
- **Bottleneck Identification**: Performance bottleneck detection

### 📈 Historical Analytics
- **Trend Analysis**: Long-term usage pattern identification
- **Growth Metrics**: Platform growth and adoption tracking
- **Seasonal Patterns**: Usage fluctuation analysis
- **Comparative Analytics**: Period-over-period comparisons

### 🔗 Data Aggregation
- **Summary Statistics**: Consolidated usage summaries
- **Top Performing Contracts**: Most used contract identification
- **User Segmentation**: User behavior categorization
- **Custom Reports**: Flexible reporting capabilities

### 🛡️ Privacy Protection
- **Address Hashing**: User anonymization through cryptographic hashing
- **Configurable Privacy**: Toggle privacy protection on/off
- **Data Minimization**: Only collect necessary analytics data
- **GDPR Compliance**: Privacy-by-design approach

### 📋 Analytics Reporting
- **Automated Reports**: Weekly and monthly report generation
- **Custom Time Ranges**: Flexible reporting periods
- **Export Capabilities**: Data export for external analysis
- **Dashboard Integration**: Ready for visualization dashboards

### 🚀 Optimization Suggestions
- **Gas Optimization**: Automated suggestions for gas efficiency improvements
- **Performance Tuning**: Recommendations for contract optimization
- **Batching Opportunities**: Suggestions for operation batching
- **Storage Optimization**: Storage pattern improvement recommendations

## Architecture

### Data Structures

#### UsageEvent
```rust
pub struct UsageEvent {
    pub event_type: String,           // Type of event (transaction, vote, etc.)
    pub user_hash: String,            // Privacy-protected user identifier
    pub timestamp: U64,               // Event timestamp
    pub contract_address: Address,    // Contract that generated the event
    pub gas_used: U64,                // Gas consumed by the event
    pub event_data: Map<String, String>, // Additional event metadata
}
```

#### EngagementMetrics
```rust
pub struct EngagementMetrics {
    pub active_users: U64,            // Currently active users
    pub daily_active_users: U64,      // Daily active users
    pub weekly_active_users: U64,     // Weekly active users
    pub monthly_active_users: U64,    // Monthly active users
    pub total_transactions: U64,       // Total transaction count
    pub avg_gas_per_tx: U64,          // Average gas per transaction
    pub retention_rate: I128,         // User retention rate (basis points)
}
```

#### PerformanceIndicator
```rust
pub struct PerformanceIndicator {
    pub contract_name: String,         // Contract identifier
    pub avg_execution_time: U64,       // Average execution time
    pub success_rate: I128,           // Success rate (basis points)
    pub error_rate: I128,             // Error rate (basis points)
    pub gas_efficiency: I128,         // Gas efficiency score (basis points)
    pub uptime: I128,                  // Uptime percentage (basis points)
}
```

#### AggregatedStats
```rust
pub struct AggregatedStats {
    pub period: String,               // Report period (daily, weekly, monthly)
    pub timestamp: U64,               // Report generation timestamp
    pub total_events: U64,            // Total events in period
    pub unique_users: U64,            // Unique users in period
    pub total_gas: U64,               // Total gas consumed
    pub top_contracts: Vec<String>,   // Most used contracts
    pub engagement: EngagementMetrics, // Engagement metrics
    pub performance: PerformanceIndicator, // Performance metrics
}
```

### Storage Layout

| Key | Data Type | Description |
|-----|-----------|-------------|
| 0 | Address | Contract admin |
| 1 | U64 | Total event count |
| 2 | Map<String, U64> | User activity tracking |
| 3 | Vec<AggregatedStats> | Daily statistics |
| 4 | Vec<AggregatedStats> | Weekly statistics |
| 5 | Vec<AggregatedStats> | Monthly statistics |
| 6 | Bool | Privacy settings |
| 1000+ | UsageEvent | Individual events |
| 5000+ | User data | User-specific analytics |
| 10000+ | PerformanceIndicator | Contract performance data |

## API Reference

### Core Functions

#### `initialize(admin: Address, privacy_enabled: bool)`
Initializes the analytics contract with admin address and privacy settings.

**Parameters:**
- `admin`: Address of the contract administrator
- `privacy_enabled`: Whether to enable privacy protection

**Authorization:** None (only callable once)

---

#### `record_event(event_type: String, user: Address, contract_address: Address, gas_used: U64, event_data: Map<String, String>) -> U64`
Records a usage event with privacy protection.

**Parameters:**
- `event_type`: Type of event being recorded
- `user`: Address of the user performing the action
- `contract_address`: Address of the contract being interacted with
- `gas_used`: Amount of gas consumed by the event
- `event_data`: Additional metadata about the event

**Returns:** Event ID for the recorded event

**Authorization:** None

---

#### `get_engagement_metrics(period: String) -> EngagementMetrics`
Retrieves engagement metrics for a specified period.

**Parameters:**
- `period`: Time period ("daily", "weekly", or "monthly")

**Returns:** Engagement metrics for the specified period

**Authorization:** None

---

#### `get_performance_indicators(contract_address: Address) -> PerformanceIndicator`
Retrieves performance indicators for a specific contract.

**Parameters:**
- `contract_address`: Address of the contract to analyze

**Returns:** Performance indicators for the contract

**Authorization:** None

---

#### `generate_report(period: String, start_time: U64, end_time: U64) -> AggregatedStats`
Generates a comprehensive analytics report for a time range.

**Parameters:**
- `period`: Report period type ("daily", "weekly", "monthly")
- `start_time`: Start timestamp for the report
- `end_time`: End timestamp for the report

**Returns:** Comprehensive analytics report

**Authorization:** None

---

#### `get_optimization_suggestions() -> Vec<String>`
Provides optimization suggestions based on usage patterns.

**Returns:** Vector of optimization suggestions

**Authorization:** None

---

### Admin Functions

#### `update_privacy_settings(privacy_enabled: bool)`
Updates the privacy protection settings.

**Parameters:**
- `privacy_enabled`: New privacy setting

**Authorization:** Admin only

---

#### `clear_old_data(older_than: U64)`
Removes analytics data older than specified timestamp.

**Parameters:**
- `older_than`: Timestamp threshold for data removal

**Authorization:** Admin only

## Integration Guide

### 1. Contract Integration

To integrate analytics into your existing contracts, add the following to each contract function you want to track:

```rust
use soroban_sdk::{Address, Env, String, Map, U64};

// In your contract functions
pub fn your_function(e: Env, user: Address, ...) {
    // Your existing logic
    
    // Record analytics event
    let analytics_address = Address::from_string(&e, "ANALYTICS_CONTRACT_ADDRESS");
    let event_data = Map::<String, String>::new(&e);
    event_data.set(String::from_str(&e, "action"), String::from_str(&e, "your_action"));
    
    // Call analytics contract (would need cross-contract call setup)
    // analytics_contract.record_event(
    //     String::from_str(&e, "transaction"),
    //     user,
    //     e.current_contract_address(),
    //     50000, // estimated gas
    //     event_data
    // );
    
    // Continue with your function logic
}
```

### 2. Event Types

Standard event types for consistent tracking:

- `"transaction"` - Token transfers and payments
- `"vote"` - DAO voting activities
- `"proposal"` - Proposal creation and management
- `"mint"` - Token minting operations
- `"burn"` - Token burning operations
- `"escrow"` - Escrow contract interactions
- `"governance"` - Governance-related activities

### 3. Event Data

Common event data keys:

- `"action"` - Specific action performed
- `"amount"` - Transaction amount (if applicable)
- `"result"` - Success/failure status
- `"category"` - Event category
- `"source"` - Source application or interface

## Deployment

### Prerequisites

- Rust 1.70 or later
- Soroban CLI
- Node.js (for deployment scripts)
- Admin account address

### Build Contract

```bash
cd contracts/analytics
cargo build --target wasm32-unknown-unknown --release
```

### Deploy Contract

```bash
# Using the deployment script
npm run deploy:analytics <ADMIN_ADDRESS> [--privacy] [--mainnet]

# Or manually
node scripts/deploy_usage_analytics.js <ADMIN_ADDRESS> --privacy
```

### Environment Variables

```bash
export ANALYTICS_ADMIN="G_ADMIN_ADDRESS_HERE"
export SOROBAN_NETWORK="testnet"  # or "mainnet"
```

## Usage Examples

### Recording Events

```rust
// Record a token transfer event
let event_data = Map::<String, String>::new(&e);
event_data.set(String::from_str(&e, "action"), String::from_str(&e, "transfer"));
event_data.set(String::from_str(&e, "amount"), String::from_str(&e, "1000"));
event_data.set(String::from_str(&e, "recipient"), String::from_str(&e, &recipient.to_string()));

let event_id = usage_analytics.record_event(
    String::from_str(&e, "transaction"),
    user,
    token_address,
    45000,
    event_data
);
```

### Getting Analytics

```rust
// Get daily engagement metrics
let daily_metrics = usage_analytics.get_engagement_metrics(String::from_str(&e, "daily"));

// Get performance indicators for token contract
let token_performance = usage_analytics.get_performance_indicators(token_address);

// Generate weekly report
let weekly_report = usage_analytics.generate_report(
    String::from_str(&e, "weekly"),
    start_timestamp,
    end_timestamp
);
```

### Optimization Suggestions

```rust
// Get optimization suggestions
let suggestions = usage_analytics.get_optimization_suggestions();

for suggestion in suggestions.iter() {
    println!("Suggestion: {}", suggestion);
}
```

## Gas Optimization

The contract is designed with gas efficiency in mind:

- **Batch Operations**: Multiple events can be recorded efficiently
- **Storage Optimization**: Minimal storage usage for analytics data
- **Lazy Calculation**: Metrics calculated on-demand to save gas
- **Data Cleanup**: Automatic cleanup of old data to prevent storage bloat

### Gas Usage Estimates

| Operation | Estimated Gas |
|-----------|---------------|
| initialize | ~50,000 |
| record_event | ~30,000 |
| get_engagement_metrics | ~15,000 |
| get_performance_indicators | ~10,000 |
| generate_report | ~25,000 |
| get_optimization_suggestions | ~20,000 |

## Privacy Considerations

### Privacy Protection Modes

1. **Enabled (Default)**: User addresses are hashed before storage
2. **Disabled**: User addresses stored as plain text (for debugging)

### Hashing Implementation

The contract uses a simple hash function for privacy protection. In production, consider upgrading to a more secure cryptographic hash.

### Data Retention

- **Default Retention**: Indefinite (subject to manual cleanup)
- **Recommended Cleanup**: Remove data older than 1 year for privacy compliance
- **Admin Control**: Only admin can clear old data

## Security Considerations

### Access Control

- **Admin Functions**: Only contract admin can update settings and clear data
- **Public Functions**: Analytics data is publicly readable for transparency
- **Event Recording**: Anyone can record events (to enable comprehensive tracking)

### Data Integrity

- **Immutable Events**: Once recorded, events cannot be modified
- **Timestamp Validation**: Events are timestamped by the ledger
- **Authorization Checks**: Admin functions require proper authorization

### Potential Risks

- **Privacy Leakage**: If privacy is disabled, user addresses are exposed
- **Storage Costs**: High event volume can increase storage costs
- **Data Manipulation**: Malicious actors could flood with fake events

## Monitoring and Maintenance

### Key Metrics to Monitor

- **Event Volume**: Total events recorded per day/week/month
- **Gas Usage**: Average gas per analytics operation
- **Storage Growth**: Rate of storage consumption
- **Error Rates**: Failed analytics operations

### Maintenance Tasks

- **Regular Data Cleanup**: Remove old data to control costs
- **Privacy Settings Review**: Ensure privacy settings meet requirements
- **Performance Monitoring**: Track contract performance over time
- **Security Audits**: Regular security reviews of analytics data

### Alerts and Notifications

Set up alerts for:

- High gas usage spikes
- Storage approaching limits
- Unusual event patterns
- Privacy setting changes

## Troubleshooting

### Common Issues

1. **High Gas Costs**
   - Check for event flooding
   - Review data cleanup policies
   - Optimize event recording frequency

2. **Privacy Concerns**
   - Verify privacy settings are enabled
   - Check user hashing implementation
   - Review data retention policies

3. **Performance Issues**
   - Monitor storage growth
   - Check for inefficient queries
   - Review report generation frequency

### Debug Mode

For debugging, temporarily disable privacy to see actual user addresses:

```rust
// Admin only
usage_analytics.update_privacy_settings(false);
```

Remember to re-enable privacy after debugging:

```rust
usage_analytics.update_privacy_settings(true);
```

## Future Enhancements

### Planned Features

- **Advanced Analytics**: Machine learning-based pattern recognition
- **Real-time Dashboard**: Web-based analytics dashboard
- **Custom Metrics**: User-defined analytics metrics
- **Export Formats**: Multiple export formats (CSV, JSON, etc.)
- **API Integration**: REST API for external analytics tools

### Scalability Improvements

- **Sharding**: Distribute analytics across multiple contracts
- **Caching**: Implement caching for frequently accessed metrics
- **Compression**: Compress historical data to save storage
- **Streaming**: Real-time event streaming capabilities

## License

This contract is part of the CurrentDAO project and is licensed under the same terms as the main project.

## Support

For support and questions:

- **GitHub Issues**: Create an issue in the CurrentDAO-contracts repository
- **Documentation**: Refer to the main CurrentDAO documentation
- **Community**: Join the CurrentDAO community discussions

---

*Last updated: [Current Date]*
